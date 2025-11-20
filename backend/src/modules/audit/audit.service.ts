import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    async logAction(transactionId: string, operation: string, userId: string | null, metadata: any) {
        return this.prisma.auditLog.create({
            data: {
                transactionId,
                operation,
                userId,
                metadata,
            },
        });
    }

    async getAuditTrail(transactionId: string) {
        return this.prisma.auditLog.findMany({
            where: { transactionId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findAll() {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }
}
