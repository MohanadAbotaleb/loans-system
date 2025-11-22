import { PrismaService } from '../prisma/prisma.service';
import { RollbackTransactionDto } from './dto/rollback-transaction.dto';
export declare class RollbacksService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    rollbackTransaction(data: RollbackTransactionDto): Promise<any>;
    private rollbackDisbursement;
    private rollbackPayment;
}
