"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DisbursementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisbursementsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DisbursementsService = DisbursementsService_1 = class DisbursementsService {
    prisma;
    logger = new common_1.Logger(DisbursementsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async disburseLoan(data) {
        this.logger.log(`Starting disbursement for loan ${data.loanId}`);
        const start = Date.now();
        try {
            return await this.prisma.$transaction(async (prisma) => {
                const existing = await prisma.disbursement.findUnique({
                    where: { loanId: data.loanId },
                });
                if (existing) {
                    throw new common_1.ConflictException('Loan already disbursed');
                }
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
                const disbursement = await prisma.disbursement.create({
                    data: {
                        loanId: data.loanId,
                        amount: data.amount,
                        disbursementDate: new Date(),
                        status: 'completed',
                    },
                });
                const scheduleData = this.generateSchedule(data, disbursement.disbursementDate);
                await prisma.repaymentSchedule.createMany({
                    data: scheduleData,
                });
                this.logger.log(`Disbursement completed for loan ${data.loanId} in ${Date.now() - start}ms`);
                return disbursement;
            });
        }
        catch (error) {
            this.logger.error(`Disbursement failed for loan ${data.loanId}`, error.stack);
            throw error;
        }
    }
    generateSchedule(data, startDate) {
        const schedule = [];
        const monthlyRate = data.interestRate / 12 / 100;
        const pmt = (data.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -data.tenor));
        let outstandingBalance = data.amount;
        let currentDate = new Date(startDate);
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
};
exports.DisbursementsService = DisbursementsService;
exports.DisbursementsService = DisbursementsService = DisbursementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DisbursementsService);
//# sourceMappingURL=disbursements.service.js.map