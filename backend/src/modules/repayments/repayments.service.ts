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

            if (loan.status !== 'active' && loan.status !== 'completed') {
                throw new BadRequestException('Loan must be active to accept payments');
            }

            // Calculate outstanding principal from total payments made
            const payments = await prisma.payment.findMany({
                where: { loanId: loan.id },
                select: { principalPaid: true }
            });
            const totalPrincipalPaidSoFar = payments.reduce((sum, p) => sum + Number(p.principalPaid), 0);
            const totalOutstandingPrincipal = Number(loan.amount) - totalPrincipalPaidSoFar;

            const lastPaymentDate = loan.payments[0]?.paymentDate || loan.createdAt;
            const daysSinceLastPayment = Math.floor((new Date().getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24));

            // Calculate accrued interest
            const dailyRate = (Number(loan.interestRate) / 100) / 365;
            const accruedInterest = totalOutstandingPrincipal * dailyRate * daysSinceLastPayment;

            // Calculate late fees
            const schedules = await prisma.repaymentSchedule.findMany({
                where: { loanId: loan.id },
                orderBy: { dueDate: 'asc' },
            });

            const nextInstallment = schedules.find(s => s.status === 'pending');

            let lateFee = 0;
            let daysLate = 0;

            if (nextInstallment && new Date() > nextInstallment.dueDate) {
                daysLate = Math.floor((new Date().getTime() - new Date(nextInstallment.dueDate).getTime()) / (1000 * 3600 * 24));
                if (daysLate > 3) {
                    lateFee = daysLate > 30 ? 50 : 25;
                }
            }

            // Prevent overpayment
            const totalDue = totalOutstandingPrincipal + accruedInterest + lateFee;
            if (data.amount > totalDue + 0.01) {
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

            // Update schedules based on total principal paid
            let totalPrincipalAvailable = totalPrincipalPaidSoFar + principalPaid;

            for (const schedule of schedules) {
                const schedulePrincipal = Number(schedule.principalAmount);

                if (totalPrincipalAvailable >= schedulePrincipal - 0.01) {
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
                    totalPrincipalAvailable = 0;
                }
            }

            // Mark loan as completed if all schedules are paid
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
        // Calculate overdue amount
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
