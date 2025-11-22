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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LoansService = class LoansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.excludeRolledBack) {
            where.disbursement = {
                rolledBackAt: null
            };
        }
        const count = await this.prisma.loan.count({ where });
        const data = await this.prisma.loan.findMany({
            where,
            include: { disbursement: true },
            orderBy: { createdAt: 'desc' },
        });
        return { data, count };
    }
    async findOne(id) {
        return this.prisma.loan.findUnique({
            where: { id },
            include: {
                payments: true,
                disbursement: true,
            }
        });
    }
    async getAuditTrail(id) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: {
                disbursement: true,
                payments: true,
            }
        });
        if (!loan)
            return [];
        const transactionIds = [
            loan.disbursement?.id,
            ...loan.payments.map(p => p.id)
        ].filter(Boolean);
        return this.prisma.auditLog.findMany({
            where: {
                transactionId: {
                    in: transactionIds
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LoansService);
//# sourceMappingURL=loans.service.js.map