import { PrismaService } from '../../prisma/prisma.service';
import { RollbackTransactionDto } from './dto/rollback-transaction.dto';
export declare class RollbacksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        data: {
            id: string;
            createdAt: Date;
            transactionId: string;
            originalOperation: string;
            rollbackReason: string;
            compensatingActions: import("@prisma/client/runtime/library").JsonValue;
            rolledBackBy: string | null;
        }[];
        count: number;
    }>;
    rollbackTransaction(data: RollbackTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        originalOperation: string;
        rollbackReason: string;
        compensatingActions: import("@prisma/client/runtime/library").JsonValue;
        rolledBackBy: string | null;
    }>;
}
