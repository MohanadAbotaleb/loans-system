import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RollbackTransactionDto } from './dto/rollback-transaction.dto';

@Injectable()
export class RollbacksService {
    private readonly logger = new Logger(RollbacksService.name);

    constructor(private prisma: PrismaService) { }

    async findAll() {
        const count = await this.prisma.rollbackRecord.count();
        const data = await this.prisma.rollbackRecord.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { data, count };
    }

    async rollbackTransaction(data: RollbackTransactionDto) {
        this.logger.log(`Initiating rollback for transaction ${data.transactionId}`);

        return await this.prisma.$transaction(async (prisma) => {
            // 1. Identify transaction type
            const disbursement = await prisma.disbursement.findFirst({ where: { id: data.transactionId } }); // Assuming transactionId maps to ID for now, or we search by ID
            // Actually, requirements say "transactionId" which could be disbursement ID or payment ID.
            // Let's check both tables.

            let type: 'disbursement' | 'payment' | null = null;
            let originalRecord: any = null;

            if (disbursement) {
                type = 'disbursement';
                originalRecord = disbursement;
            } else {
                const payment = await prisma.payment.findFirst({ where: { id: data.transactionId } });
                if (payment) {
                    type = 'payment';
                    originalRecord = payment;
                }
            }

            if (!type) {
                throw new NotFoundException('Transaction not found');
            }

            if (type === 'disbursement' && originalRecord.rolledBackAt) {
                throw new BadRequestException('Transaction already rolled back');
            }

            if (type === 'payment' && originalRecord.rolledBackAt) {
                throw new BadRequestException('Transaction already rolled back');
            }

            // 2. Perform compensating actions
            const compensatingActions: any[] = [];

            if (type === 'disbursement') {
                // Reverse disbursement:
                // - Mark disbursement as rolled_back
                // - Cancel repayment schedules?
                // - Update Loan status to cancelled?

                await prisma.disbursement.update({
                    where: { id: originalRecord.id },
                    data: { status: 'rolled_back', rolledBackAt: new Date() }
                });
                compensatingActions.push({ action: 'update_disbursement_status', status: 'rolled_back' });

                // Cancel schedules
                await prisma.repaymentSchedule.updateMany({
                    where: { loanId: originalRecord.loanId },
                    data: { status: 'cancelled' }
                });
                compensatingActions.push({ action: 'cancel_repayment_schedules' });

                // Cancel Loan
                await prisma.loan.update({
                    where: { id: originalRecord.loanId },
                    data: { status: 'cancelled' }
                });
                compensatingActions.push({ action: 'cancel_loan' });

            } else if (type === 'payment') {
                // Reverse payment:
                // - Mark payment as rolled_back
                // - Revert repayment schedules by "replaying" remaining payments

                await prisma.payment.update({
                    where: { id: originalRecord.id },
                    data: { status: 'rolled_back', rolledBackAt: new Date() }
                });
                compensatingActions.push({ action: 'update_payment_status', status: 'rolled_back' });

                // Get all non-rolled-back payments for this loan (excluding the current one)
                const remainingPayments = await prisma.payment.findMany({
                    where: {
                        loanId: originalRecord.loanId,
                        rolledBackAt: null,
                        id: { not: originalRecord.id }
                    },
                    orderBy: { paymentDate: 'asc' }
                });

                // Get loan to calculate total principal
                const loan = await prisma.loan.findUnique({ where: { id: originalRecord.loanId } });

                // Calculate total principal paid from remaining payments
                const totalPrincipalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.principalPaid), 0);

                // Get all schedules for this loan
                const schedules = await prisma.repaymentSchedule.findMany({
                    where: { loanId: originalRecord.loanId },
                    orderBy: { dueDate: 'asc' }
                });

                // Replay the schedule reconciliation logic
                let availablePrincipal = totalPrincipalPaid;
                for (const schedule of schedules) {
                    const schedulePrincipal = Number(schedule.principalAmount);

                    if (availablePrincipal >= schedulePrincipal - 0.01) {
                        // Mark as paid
                        await prisma.repaymentSchedule.update({
                            where: { id: schedule.id },
                            data: { status: 'paid', paidDate: new Date() }
                        });
                        availablePrincipal -= schedulePrincipal;
                    } else {
                        // Mark as pending
                        await prisma.repaymentSchedule.update({
                            where: { id: schedule.id },
                            data: { status: 'pending', paidDate: null }
                        });
                        availablePrincipal = 0;
                    }
                }

                // Update loan status if needed
                const remainingSchedules = await prisma.repaymentSchedule.count({
                    where: { loanId: originalRecord.loanId, status: 'pending' }
                });

                if (remainingSchedules > 0 && loan?.status === 'completed') {
                    await prisma.loan.update({
                        where: { id: originalRecord.loanId },
                        data: { status: 'active' }
                    });
                }

                compensatingActions.push({ action: 'revert_schedules_and_loan_status' });
            }

            // 3. Create Rollback Record
            const rollbackRecord = await prisma.rollbackRecord.create({
                data: {
                    transactionId: data.transactionId,
                    originalOperation: type,
                    rollbackReason: data.reason,
                    compensatingActions: JSON.stringify(compensatingActions),
                    rolledBackBy: 'system', // or user ID if available
                }
            });

            // Create audit log
            await prisma.auditLog.create({
                data: {
                    transactionId: data.transactionId,
                    operation: `${type}_rollback`,
                    userId: null,
                    metadata: {
                        rollbackId: rollbackRecord.id,
                        reason: data.reason,
                        compensatingActions
                    }
                }
            });

            this.logger.log(`Rollback completed for transaction ${data.transactionId}`);
            return rollbackRecord;
        });
    }
}
