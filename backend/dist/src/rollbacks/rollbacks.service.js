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
var RollbacksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollbacksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RollbacksService = RollbacksService_1 = class RollbacksService {
    prisma;
    logger = new common_1.Logger(RollbacksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async rollbackTransaction(data) {
        this.logger.log(`Initiating rollback for transaction ${data.transactionId}`);
        return await this.prisma.$transaction(async (prisma) => {
            const disbursement = await prisma.disbursement.findUnique({
                where: { id: data.transactionId },
            });
            if (disbursement) {
                return this.rollbackDisbursement(prisma, disbursement, data.reason);
            }
            const payment = await prisma.payment.findUnique({
                where: { id: data.transactionId },
            });
            if (payment) {
                return this.rollbackPayment(prisma, payment, data.reason);
            }
            throw new common_1.NotFoundException('Transaction not found');
        });
    }
    async rollbackDisbursement(prisma, disbursement, reason) {
        if (disbursement.status === 'rolled_back') {
            throw new common_1.BadRequestException('Transaction already rolled back');
        }
        await prisma.disbursement.update({
            where: { id: disbursement.id },
            data: {
                status: 'rolled_back',
                rolledBackAt: new Date(),
            },
        });
        await prisma.repaymentSchedule.updateMany({
            where: { loanId: disbursement.loanId },
            data: { status: 'cancelled' },
        });
        await prisma.loan.update({
            where: { id: disbursement.loanId },
            data: { status: 'cancelled' },
        });
        const record = await prisma.rollbackRecord.create({
            data: {
                transactionId: disbursement.id,
                originalOperation: 'disbursement',
                rollbackReason: reason,
                compensatingActions: {
                    action: 'cancelled_schedules_and_loan',
                    details: `Cancelled loan ${disbursement.loanId} and its schedules`,
                },
                rolledBackBy: 'system',
            },
        });
        this.logger.log(`Disbursement ${disbursement.id} rolled back`);
        return record;
    }
    async rollbackPayment(prisma, payment, reason) {
        if (payment.status === 'rolled_back') {
            throw new common_1.BadRequestException('Transaction already rolled back');
        }
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'rolled_back',
                rolledBackAt: new Date(),
            },
        });
        const record = await prisma.rollbackRecord.create({
            data: {
                transactionId: payment.id,
                originalOperation: 'repayment',
                rollbackReason: reason,
                compensatingActions: {
                    action: 'marked_payment_rolled_back',
                    details: `Payment ${payment.id} marked as rolled back. Manual reconciliation may be needed for schedules.`,
                },
                rolledBackBy: 'system',
            },
        });
        this.logger.log(`Payment ${payment.id} rolled back`);
        return record;
    }
};
exports.RollbacksService = RollbacksService;
exports.RollbacksService = RollbacksService = RollbacksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RollbacksService);
//# sourceMappingURL=rollbacks.service.js.map