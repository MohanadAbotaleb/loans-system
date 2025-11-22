import { AuditService } from './audit.service';
import type { Response } from 'express';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    getAuditTrail(transactionId: string): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        operation: string;
        userId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
