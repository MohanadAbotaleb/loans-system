import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoansService {
    constructor(private prisma: PrismaService) { }

    async findAll(filters?: { status?: string; excludeRolledBack?: boolean }) {
        const where: any = {};

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

    async findOne(id: string) {
        return this.prisma.loan.findUnique({
            where: { id },
            include: {
                payments: true,
                disbursement: true,
            }
        });
    }

    async getAuditTrail(id: string) {
        // Find all transactions related to this loan
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: {
                disbursement: true,
                payments: true,
            }
        });

        if (!loan) return [];

        const transactionIds = [
            loan.disbursement?.id,
            ...loan.payments.map(p => p.id)
        ].filter(Boolean);

        return this.prisma.auditLog.findMany({
            where: {
                transactionId: {
                    in: transactionIds as string[]
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
