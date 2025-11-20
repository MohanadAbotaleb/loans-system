import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { RepaymentCalculationService } from './repayment-calculation.service';
import { AppLogger } from '../../common/logger/app.logger';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RepaymentsService {
    constructor(
        private prisma: PrismaService,
        private calculationService: RepaymentCalculationService,
        private logger: AppLogger,
        private auditService: AuditService,
    ) { }

    async findAll(startDate?: Date, endDate?: Date) {
        const where: any = {};
        if (startDate && endDate) {
            where.paymentDate = {
                gte: startDate,
                lte: endDate,
            };
        } else if (startDate) {
            where.paymentDate = { gte: startDate };
        } else if (endDate) {
            where.paymentDate = { lte: endDate };
        }

        return this.prisma.payment.findMany({
            where,
            orderBy: { paymentDate: 'desc' },
            include: { loan: true },
        });
    }

    async findOne(id: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id },
            include: { loan: true },
        });
        if (!payment) throw new NotFoundException(`Payment ${id} not found`);
        return payment;
    }

    async processRepayment(dto: CreateRepaymentDto) {
        const { loanId, amount } = dto;

        return this.prisma.$transaction(async (tx) => {
            const loan = await tx.loan.findUnique({
                where: { id: loanId },
                include: {
                    payments: { orderBy: { paymentDate: 'desc' }, take: 1 },
                    disbursement: true
                },
            });

            if (!loan) throw new NotFoundException(`Loan ${loanId} not found`);
            if (loan.status !== 'active') throw new BadRequestException(`Loan is not active`);

            // Calculate Interest & Fees
            const lastPaymentDate = loan.payments[0]?.paymentDate || loan.disbursement?.disbursementDate || new Date();
            const daysSinceLastPayment = Math.floor((new Date().getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24));

            // Simplified calculation for MVP:
            // In a real system, we'd track outstanding principal balance.
            // Here we assume we need to fetch the schedule to know what's due.
            // For this exercise, let's use the calculation service with some assumptions.

            // We need the current outstanding principal.
            // Let's calculate it by summing up unpaid schedules or tracking it on the loan.
            // Since we don't have it on the loan, let's sum up remaining principal from schedules.
            const unpaidSchedules = await tx.repaymentSchedule.findMany({
                where: { loanId, status: 'pending' },
                orderBy: { installmentNumber: 'asc' },
            });

            const outstandingPrincipal = unpaidSchedules.reduce((sum, s) => sum + Number(s.principalAmount), 0);

            const dailyInterest = this.calculationService.calculateDailyInterest(
                outstandingPrincipal,
                Number(loan.interestRate),
                daysSinceLastPayment
            );

            // Check for late fees (simplified: check if we are past due date of the oldest unpaid schedule)
            let lateFee = 0;
            let actualDaysLate = 0;
            if (unpaidSchedules.length > 0) {
                const oldestDue = unpaidSchedules[0];
                const daysLate = Math.floor((new Date().getTime() - new Date(oldestDue.dueDate).getTime()) / (1000 * 3600 * 24));
                if (daysLate > 0) {
                    actualDaysLate = daysLate;
                    lateFee = this.calculationService.calculateLateFee(daysLate);
                }
            }

            const allocation = this.calculationService.allocatePayment(
                amount,
                dailyInterest,
                lateFee,
                outstandingPrincipal
            );

            // Create Payment Record
            const payment = await tx.payment.create({
                data: {
                    loanId,
                    amount,
                    paymentDate: new Date(),
                    principalPaid: allocation.principalPaid,
                    interestPaid: allocation.interestPaid,
                    lateFeePaid: allocation.lateFeePaid,
                    daysLate: actualDaysLate,
                    status: 'success',
                },
            });

            // Update Schedules (Simplified: knock off schedules sequentially)
            let remainingPrincipalToAllocate = allocation.principalPaid;
            for (const schedule of unpaidSchedules) {
                if (remainingPrincipalToAllocate <= 0) break;

                const schedulePrincipal = Number(schedule.principalAmount);
                if (remainingPrincipalToAllocate >= schedulePrincipal) {
                    await tx.repaymentSchedule.update({
                        where: { id: schedule.id },
                        data: { status: 'paid', paidDate: new Date() },
                    });
                    remainingPrincipalToAllocate -= schedulePrincipal;
                } else {
                    // Partial payment logic would go here (requires schema change to track paidAmount)
                    // For now, we leave it as pending but maybe log it?
                    // Or we just don't mark it paid.
                    break;
                }
            }

            // Check if loan is fully paid
            const remainingSchedules = await tx.repaymentSchedule.count({
                where: { loanId, status: 'pending' },
            });

            if (remainingSchedules === 0) {
                await tx.loan.update({
                    where: { id: loanId },
                    data: { status: 'paid' },
                });
            }

            // Audit
            await this.auditService.logAction(
                payment.id,
                'REPAYMENT',
                null,
                { amount, loanId, allocation }
            );

            this.logger.log(`Payment ${payment.id} processed for loan ${loanId}`, 'RepaymentsService');

            return payment;
        });
    }
}
