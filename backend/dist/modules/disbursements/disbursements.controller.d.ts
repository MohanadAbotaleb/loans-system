import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import type { Response } from 'express';
import { RollbacksService } from '../rollbacks/rollbacks.service';
export declare class DisbursementsController {
    private readonly disbursementsService;
    private readonly rollbacksService;
    constructor(disbursementsService: DisbursementsService, rollbacksService: RollbacksService);
    create(createDisbursementDto: CreateDisbursementDto): Promise<{
        loanId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        disbursementDate: Date;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
    }>;
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    rollback(id: string, body: {
        reason: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        originalOperation: string;
        rollbackReason: string;
        compensatingActions: import("@prisma/client/runtime/library").JsonValue;
        rolledBackBy: string | null;
    }>;
}
