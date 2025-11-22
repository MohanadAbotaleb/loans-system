import { Injectable, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DisbursementsService {
    private readonly logger = new Logger(DisbursementsService.name);

    constructor(private prisma: PrismaService) { }

    async findAll() {
        const count = await this.prisma.disbursement.count();
        const data = await this.prisma.disbursement.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { data, count };
    }

    async disburseLoan(data: CreateDisbursementDto) {
        this.logger.log(`Starting disbursement for loan ${data.loanId}`);
        const start = Date.now();

        try {
            return await this.prisma.$transaction(async (prisma) => {
                // Check idempotency
                const existing = await prisma.disbursement.findUnique({
                    where: { loanId: data.loanId },
                });

                if (existing) {
                    throw new ConflictException('Loan already disbursed');
                }

                // Create Loan record if it doesn't exist (assuming loan creation happens here or prior)
                // For this task, we'll assume we need to ensure the Loan exists or create it.
                // Based on the schema, Disbursement relates to Loan.
                // Let's check if Loan exists, if not create it (implied by requirements to "Disburse loans")
                let loan = await prisma.loan.findUnique({ where: { id: data.loanId } });
                if (!loan) {
                    loan = await prisma.loan.create({
                        data: {
                            id: data.loanId,
                            borrowerId: data.borrowerId,
                            amount: data.amount,
                            interestRate: data.interestRate,
                            tenor: data.tenor,
                            status: 'active',
                        }
                    });
                }

                // Create disbursement
                const disbursement = await prisma.disbursement.create({
                    data: {
                        loanId: data.loanId,
                        amount: data.amount,
                        disbursementDate: new Date(),
                        status: 'completed',
                    },
                });

                // Generate repayment schedule
                const scheduleData = this.generateSchedule(data, disbursement.disbursementDate);
                await prisma.repaymentSchedule.createMany({
                    data: scheduleData,
                });

                // Create audit log
                await prisma.auditLog.create({
                    data: {
                        transactionId: disbursement.id,
                        operation: 'disbursement_created',
                        userId: null, // Would come from auth context
                        metadata: {
                            loanId: data.loanId,
                            borrowerId: data.borrowerId,
                            amount: data.amount,
                            tenor: data.tenor,
                            interestRate: data.interestRate
                        }
                    }
                });

                this.logger.log(`Disbursement completed for loan ${data.loanId} in ${Date.now() - start}ms`);
                return disbursement;
            });
        } catch (error) {
            this.logger.error(`Disbursement failed for loan ${data.loanId}`, error.stack);
            throw error;
        }
    }

    private generateSchedule(data: CreateDisbursementDto, startDate: Date) {
        const schedule: Prisma.RepaymentScheduleCreateManyInput[] = [];
        const monthlyRate = data.interestRate / 12 / 100;
        // Simple amortization for example, or flat rate as per requirements implication?
        // Requirements say: "Calculate how much of payment goes to: principal, interest"
        // "Interest accrues daily based on outstanding principal" -> This implies reducing balance.
        // Let's use a standard PMT formula for equal monthly installments, or simple interest if not specified.
        // "Monthly payment: ~$888.49" for 10k, 12%, 12m -> This is standard amortization.

        let currentDate = new Date(startDate);

        if (data.interestRate === 0) {
            const principalPerMonth = data.amount / data.tenor;
            for (let i = 1; i <= data.tenor; i++) {
                currentDate.setMonth(currentDate.getMonth() + 1);
                schedule.push({
                    loanId: data.loanId,
                    installmentNumber: i,
                    dueDate: new Date(currentDate),
                    principalAmount: principalPerMonth,
                    interestAmount: 0,
                    status: 'pending',
                });
            }
            return schedule;
        }

        const pmt = (data.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -data.tenor));

        let outstandingBalance = data.amount;

        for (let i = 1; i <= data.tenor; i++) {
            currentDate.setMonth(currentDate.getMonth() + 1);

            const interest = outstandingBalance * monthlyRate;
            const principal = pmt - interest;
            outstandingBalance -= principal;

            schedule.push({
                loanId: data.loanId,
                installmentNumber: i,
                dueDate: new Date(currentDate),
                principalAmount: principal,
                interestAmount: interest,
                status: 'pending',
            });
        }
        return schedule;
    }
}
