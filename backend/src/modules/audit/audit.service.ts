import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const count = await this.prisma.auditLog.count();
        const data = await this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return { data, count };
    }

    async getAuditTrail(transactionId: string) {
        return this.prisma.auditLog.findMany({
            where: { transactionId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createAuditLog(data: {
        transactionId: string;
        operation: string;
        userId?: string;
        metadata?: any;
    }) {
        return this.prisma.auditLog.create({
            data,
        });
    }
}
