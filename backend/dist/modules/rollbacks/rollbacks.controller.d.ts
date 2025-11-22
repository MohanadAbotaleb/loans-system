import { RollbacksService } from './rollbacks.service';
import { RollbackTransactionDto } from './dto/rollback-transaction.dto';
import type { Response } from 'express';
export declare class RollbacksController {
    private readonly rollbacksService;
    constructor(rollbacksService: RollbacksService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    create(rollbackTransactionDto: RollbackTransactionDto): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        originalOperation: string;
        rollbackReason: string;
        compensatingActions: import("@prisma/client/runtime/library").JsonValue;
        rolledBackBy: string | null;
    }>;
}
