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
var RepaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RepaymentsService = RepaymentsService_1 = class RepaymentsService {
    prisma;
    logger = new common_1.Logger(RepaymentsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordRepayment(data) {
        this.logger.log(`Processing repayment for loan ${data.loanId}`);
        return await this.prisma.$transaction(async (prisma) => {
            const loan = await prisma.loan.findUnique({
                where: { id: data.loanId },
                include: { payments: { orderBy: { paymentDate: 'desc' }, take: 1 } },
            });
            if (!loan) {
                throw new common_1.NotFoundException('Loan not found');
            }
            if (loan.status !== 'active' && loan.status !== 'completed') {
            }
            const lastPaymentDate = loan.payments[0]?.paymentDate || loan.createdAt;
            const daysSinceLastPayment = Math.floor((new Date().getTime() - new Date(lastPaymentDate).getTime()) / (1000 * 3600 * 24));
            const dailyRate = (Number(loan.interestRate) / 100) / 365;
            const schedules = await prisma.repaymentSchedule.findMany({
                where: { loanId: loan.id, status: 'pending' },
                orderBy: { dueDate: 'asc' },
            });
            const totalOutstandingPrincipal = schedules.reduce((sum, s) => sum + Number(s.principalAmount), 0);
            const accruedInterest = totalOutstandingPrincipal * dailyRate * daysSinceLastPayment;
            const nextInstallment = schedules[0];
            let lateFee = 0;
            let daysLate = 0;
            if (nextInstallment && new Date() > nextInstallment.dueDate) {
                daysLate = Math.floor((new Date().getTime() - new Date(nextInstallment.dueDate).getTime()) / (1000 * 3600 * 24));
                if (daysLate > 3) {
                    lateFee = daysLate > 30 ? 50 : 25;
                }
            }
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
            if (totalOutstandingPrincipal - principalPaid <= 0.01) {
                await prisma.loan.update({
                    where: { id: loan.id },
                    data: { status: 'completed' }
                });
            }
            this.logger.log(`Repayment recorded for loan ${data.loanId}`);
            return payment;
        });
    }
};
exports.RepaymentsService = RepaymentsService;
exports.RepaymentsService = RepaymentsService = RepaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RepaymentsService);
//# sourceMappingURL=repayments.service.js.map