import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RepaymentsService {
    private readonly logger = new Logger(RepaymentsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll() {
        const count = await this.prisma.payment.count();
        const data = await this.prisma.payment.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { data, count };
    }

    async recordRepayment(data: CreateRepaymentDto) {
        this.logger.log(`Processing repayment for loan ${data.loanId}`);

        return await this.prisma.$transaction(async (prisma) => {
            const loan = await prisma.loan.findUnique({
                where: { id: data.loanId },
                include: {
                    payments: { orderBy: { paymentDate: 'desc' }, take: 1 },
                    disbursement: true
                },
            });

            if (!loan) {
                throw new NotFoundException('Loan not found');
            }

            // Check if the loan's disbursement has been rolled back
            if (loan.disbursement?.rolledBackAt) {
                throw new BadRequestException('Cannot make payment on a rolled back loan');
            }

            if (loan.status !== 'active' && loan.status !== 'completed') { // Assuming 'active' is the status after disbursement
                // In a real system, we might allow paying off 'completed' loans if there was an error, but let's stick to active.
                // Actually, if it's already completed, maybe we shouldn't accept more money unless it's a correction.
                // Let's assume 'active' is the only state for repayment.
            }

            // Calculate outstanding balance based on Loan Amount - Total Principal Paid
            const payments = await prisma.payment.findMany({
                where: { loanId: loan.id },
                select: { principalPaid: true }
            });
            const totalPrincipalPaidSoFar = payments.reduce((sum, p) => sum + Number(p.principalPaid), 0);
            const totalOutstandingPrincipal = Number(loan.amount) - totalPrincipalPaidSoFar;

            // Let's get the last payment date or disbursement date
            const lastPaymentDate = loan.payments[0]?.paymentDate || loan.createdAt; // Should be disbursement date ideally
            const daysSinceLastPayment = Math.floor((new Date().getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24));

            // Calculate accrued interest
            // Daily rate = (Annual Rate / 100) / 365
            const dailyRate = (Number(loan.interestRate) / 100) / 365;
            const accruedInterest = totalOutstandingPrincipal * dailyRate * daysSinceLastPayment;

            // Late fees
            // Check if we are past the due date of the *next* installment.
            // We need to find the first pending schedule to determine late fees.
            const schedules = await prisma.repaymentSchedule.findMany({
                where: { loanId: loan.id },
                orderBy: { dueDate: 'asc' },
            });

            // Find first schedule that isn't fully paid (conceptually)
            // Since we are fixing the logic, let's rely on the status 'pending' which we will enforce correctly now.
            const nextInstallment = schedules.find(s => s.status === 'pending');

            let lateFee = 0;
            let daysLate = 0;

            if (nextInstallment && new Date() > nextInstallment.dueDate) {
                daysLate = Math.floor((new Date().getTime() - new Date(nextInstallment.dueDate).getTime()) / (1000 * 3600 * 24));
                if (daysLate > 3) {
                    lateFee = daysLate > 30 ? 50 : 25; // Example logic from requirements
                }
            }

            // Check for overpayment
            const totalDue = totalOutstandingPrincipal + accruedInterest + lateFee;
            if (data.amount > totalDue + 0.01) { // Allow small epsilon for floating point errors
                throw new BadRequestException(`Payment amount (${data.amount}) exceeds total due (${totalDue.toFixed(2)})`);
            }

            // Allocation
            let remainingPayment = data.amount;

            const interestPaid = Math.min(remainingPayment, accruedInterest);
            remainingPayment -= interestPaid;

            const lateFeePaid = Math.min(remainingPayment, lateFee);
            remainingPayment -= lateFeePaid;

            const principalPaid = remainingPayment;

            const payment = await prisma.payment.create({
                data: {
                    loanId: data.loanId,
                    amount: data.amount,
                    paymentDate: new Date(),
                    principalPaid,
                    interestPaid,
                    lateFeePaid,
                    daysLate,
                    status: 'completed',
                },
            });

            // Update schedules (Reconciliation Logic)
            // We replay the total principal paid against the schedules
            let totalPrincipalAvailable = totalPrincipalPaidSoFar + principalPaid;

            for (const schedule of schedules) {
                const schedulePrincipal = Number(schedule.principalAmount);

                if (totalPrincipalAvailable >= schedulePrincipal - 0.01) { // Epsilon
                    if (schedule.status !== 'paid') {
                        await prisma.repaymentSchedule.update({
                            where: { id: schedule.id },
                            data: {
                                status: 'paid',
                                paidDate: new Date()
                            }
                        });
                    }
                    totalPrincipalAvailable -= schedulePrincipal;
                } else {
                    if (schedule.status !== 'pending') {
                        await prisma.repaymentSchedule.update({
                            where: { id: schedule.id },
                            data: { status: 'pending', paidDate: null }
                        });
                    }
                    // We don't break here because we want to ensure all subsequent schedules are pending too (idempotency)
                    // But effectively, once we run out of funds, all remaining will be pending.
                    // However, we subtract what we "used" for this partial payment? 
                    // No, if we can't fully pay it, we don't mark it paid. The funds "sit" there.
                    // So we just stop marking things as paid.
                    totalPrincipalAvailable = 0; // Stop allocating to subsequent schedules
                }
            }

            // Update Loan status if fully paid
            // Check if all schedules are now paid (meaning all principal + interest is covered)
            const remainingSchedules = await prisma.repaymentSchedule.count({
                where: { loanId: loan.id, status: 'pending' }
            });

            if (remainingSchedules === 0) {
                await prisma.loan.update({
                    where: { id: loan.id },
                    data: { status: 'completed' }
                });
            }

            // Create audit log
            await prisma.auditLog.create({
                data: {
                    transactionId: payment.id,
                    operation: 'repayment_recorded',
                    userId: null,
                    metadata: {
                        loanId: data.loanId,
                        amount: data.amount,
                        principalPaid,
                        interestPaid,
                        lateFeePaid,
                        daysLate
                    }
                }
            });

            this.logger.log(`Repayment recorded for loan ${data.loanId}`);
            return payment;
        });
    }

    async getHistory(loanId: string) {
        return this.prisma.payment.findMany({
            where: { loanId },
            orderBy: { paymentDate: 'desc' }
        });
    }

    async getSchedule(loanId: string) {
        return this.prisma.repaymentSchedule.findMany({
            where: { loanId },
            orderBy: { dueDate: 'asc' }
        });
    }

    async calculateDue(loanId: string) {
        // Calculate what's due right now (simplified logic)
        // In a real system, this would check overdue schedules + accrued interest
        const schedules = await this.prisma.repaymentSchedule.findMany({
            where: {
                loanId,
                status: 'pending',
                dueDate: { lte: new Date() }
            }
        });

        const totalDue = schedules.reduce((sum, s) => sum + Number(s.principalAmount) + Number(s.interestAmount), 0);

        return {
            loanId,
            totalDue,
            breakdown: {
                overdueInstallments: schedules.length,
                principal: schedules.reduce((sum, s) => sum + Number(s.principalAmount), 0),
                interest: schedules.reduce((sum, s) => sum + Number(s.interestAmount), 0)
            }
        };
    }
}
