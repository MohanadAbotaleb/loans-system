import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    getAuditTrail(transactionId: string): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        operation: string;
        userId: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    createAuditLog(data: {
        transactionId: string;
        operation: string;
        userId?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        operation: string;
        userId: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }>;
}
