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
const prisma_service_1 = require("../../prisma/prisma.service");
let RollbacksService = RollbacksService_1 = class RollbacksService {
    prisma;
    logger = new common_1.Logger(RollbacksService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const count = await this.prisma.rollbackRecord.count();
        const data = await this.prisma.rollbackRecord.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { data, count };
    }
    async rollbackTransaction(data) {
        this.logger.log(`Initiating rollback for transaction ${data.transactionId}`);
        return await this.prisma.$transaction(async (prisma) => {
            const disbursement = await prisma.disbursement.findFirst({ where: { id: data.transactionId } });
            let type = null;
            let originalRecord = null;
            if (disbursement) {
                type = 'disbursement';
                originalRecord = disbursement;
            }
            else {
                const payment = await prisma.payment.findFirst({ where: { id: data.transactionId } });
                if (payment) {
                    type = 'payment';
                    originalRecord = payment;
                }
            }
            if (!type) {
                throw new common_1.NotFoundException('Transaction not found');
            }
            if (type === 'disbursement' && originalRecord.rolledBackAt) {
                throw new common_1.BadRequestException('Transaction already rolled back');
            }
            if (type === 'payment' && originalRecord.rolledBackAt) {
                throw new common_1.BadRequestException('Transaction already rolled back');
            }
            const compensatingActions = [];
            if (type === 'disbursement') {
                await prisma.disbursement.update({
                    where: { id: originalRecord.id },
                    data: { status: 'rolled_back', rolledBackAt: new Date() }
                });
                compensatingActions.push({ action: 'update_disbursement_status', status: 'rolled_back' });
                await prisma.repaymentSchedule.updateMany({
                    where: { loanId: originalRecord.loanId },
                    data: { status: 'cancelled' }
                });
                compensatingActions.push({ action: 'cancel_repayment_schedules' });
                await prisma.loan.update({
                    where: { id: originalRecord.loanId },
                    data: { status: 'cancelled' }
                });
                compensatingActions.push({ action: 'cancel_loan' });
            }
            else if (type === 'payment') {
                await prisma.payment.update({
                    where: { id: originalRecord.id },
                    data: { status: 'rolled_back', rolledBackAt: new Date() }
                });
                compensatingActions.push({ action: 'update_payment_status', status: 'rolled_back' });
                const remainingPayments = await prisma.payment.findMany({
                    where: {
                        loanId: originalRecord.loanId,
                        rolledBackAt: null,
                        id: { not: originalRecord.id }
                    },
                    orderBy: { paymentDate: 'asc' }
                });
                const loan = await prisma.loan.findUnique({ where: { id: originalRecord.loanId } });
                const totalPrincipalPaid = remainingPayments.reduce((sum, p) => sum + Number(p.principalPaid), 0);
                const schedules = await prisma.repaymentSchedule.findMany({
                    where: { loanId: originalRecord.loanId },
                    orderBy: { dueDate: 'asc' }
                });
                let availablePrincipal = totalPrincipalPaid;
                for (const schedule of schedules) {
                    const schedulePrincipal = Number(schedule.principalAmount);
                    if (availablePrincipal >= schedulePrincipal - 0.01) {
                        await prisma.repaymentSchedule.update({
                            where: { id: schedule.id },
                            data: { status: 'paid', paidDate: new Date() }
                        });
                        availablePrincipal -= schedulePrincipal;
                    }
                    else {
                        await prisma.repaymentSchedule.update({
                            where: { id: schedule.id },
                            data: { status: 'pending', paidDate: null }
                        });
                        availablePrincipal = 0;
                    }
                }
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
            const rollbackRecord = await prisma.rollbackRecord.create({
                data: {
                    transactionId: data.transactionId,
                    originalOperation: type,
                    rollbackReason: data.reason,
                    compensatingActions: JSON.stringify(compensatingActions),
                    rolledBackBy: 'system',
                }
            });
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
};
exports.RollbacksService = RollbacksService;
exports.RollbacksService = RollbacksService = RollbacksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RollbacksService);
//# sourceMappingURL=rollbacks.service.js.map