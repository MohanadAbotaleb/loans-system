import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { AppLogger } from '../../common/logger/app.logger';
import { AuditService } from '../../modules/audit/audit.service';

@Injectable()
export class DisbursementsService {
    constructor(
        private prisma: PrismaService,
        private logger: AppLogger,
        private auditService: AuditService,
    ) { }

    async findAll() {
        return this.prisma.disbursement.findMany({
            orderBy: { disbursementDate: 'desc' },
            include: { loan: true },
        });
    }

    async findOne(id: string) {
        const disbursement = await this.prisma.disbursement.findUnique({
            where: { id },
            include: { loan: true },
        });
        if (!disbursement) throw new NotFoundException(`Disbursement ${id} not found`);
        return disbursement;
    }

    async disburseLoan(dto: CreateDisbursementDto) {
        const { loanId, borrowerId, amount, currency, tenor, interestRate } = dto;
        const startTime = Date.now();

        this.logger.log(`Starting loan disbursement`, 'DisbursementsService', {
            loanId,
            amount,
            borrowerId,
            transactionId: loanId,
        });

        // Idempotency check
        const existingDisbursement = await this.prisma.disbursement.findUnique({
            where: { loanId },
        });

        if (existingDisbursement) {
            this.logger.warn(`Duplicate disbursement attempt for loan ${loanId}`);
            throw new ConflictException(`Loan ${loanId} already disbursed`);
        }

        // Check platform funds availability
        const platformFunds = await this.prisma.platformFunds.findFirst({
            where: { currency: currency || 'USD' },
        });

        if (!platformFunds || Number(platformFunds.availableBalance) < amount) {
            const available = platformFunds ? Number(platformFunds.availableBalance) : 0;
            this.logger.error(
                `Insufficient platform funds for disbursement`,
                undefined,
                'DisbursementsService',
                { loanId, required: amount, available }
            );
            throw new ConflictException(
                `Insufficient platform funds. Required: ${amount}, Available: ${available}`
            );
        }

        return this.prisma.$transaction(async (tx) => {
            // 1. Deduct from platform funds
            await tx.platformFunds.update({
                where: { id: platformFunds.id },
                data: {
                    availableBalance: Number(platformFunds.availableBalance) - amount,
                },
            });

            // 2. Upsert Loan
            const loan = await tx.loan.upsert({
                where: { id: loanId },
                update: { status: 'active' },
                create: {
                    id: loanId,
                    borrowerId,
                    amount,
                    interestRate,
                    tenor,
                    status: 'active',
                },
            });

            // 3. Create Disbursement
            const disbursement = await tx.disbursement.create({
                data: {
                    loanId,
                    amount,
                    disbursementDate: new Date(),
                    status: 'success',
                },
            });

            // 3. Generate Repayment Schedule (Simple EMI or Flat for now)
            // Assuming monthly payments
            const monthlyRate = interestRate / 12 / 100;
            // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
            // For simplicity in this MVP, let's use a simpler flat interest or just principal/tenor + interest
            // Let's stick to the requirement: "automatic repayment schedule generation"
            // We'll implement a simple equal principal + interest model for clarity or standard EMI if preferred.
            // Let's use standard EMI.

            let emi: number;
            if (monthlyRate === 0) {
                emi = amount / tenor;
            } else {
                emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenor)) / (Math.pow(1 + monthlyRate, tenor) - 1);
            }

            const schedules: any[] = [];
            const baseDate = new Date();
            let remainingBalance = Number(amount);

            for (let i = 1; i <= tenor; i++) {
                // Create a new date for each installment (add i months to base date)
                const dueDate = new Date(baseDate);
                dueDate.setMonth(baseDate.getMonth() + i);

                const interestPart = remainingBalance * monthlyRate;
                const principalPart = emi - interestPart;

                remainingBalance -= principalPart;

                schedules.push({
                    loanId,
                    installmentNumber: i,
                    dueDate: dueDate,
                    principalAmount: principalPart,
                    interestAmount: interestPart,
                    status: 'pending',
                });
            }

            await tx.repaymentSchedule.createMany({
                data: schedules,
            });

            // Audit
            await this.auditService.logAction(
                disbursement.id,
                'DISBURSEMENT',
                borrowerId,
                { amount, loanId }
            );

            const duration = Date.now() - startTime;
            this.logger.log(
                `Loan ${loanId} disbursed successfully`,
                'DisbursementsService',
                { transactionId: loanId, duration: `${duration}ms` }
            );

            return { disbursement, loan };
        });
    }
}
