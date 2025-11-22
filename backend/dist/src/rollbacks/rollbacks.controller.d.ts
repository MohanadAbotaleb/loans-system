import { RollbacksService } from './rollbacks.service';
import { RollbackTransactionDto } from './dto/rollback-transaction.dto';
export declare class RollbacksController {
    private readonly rollbacksService;
    constructor(rollbacksService: RollbacksService);
    create(rollbackTransactionDto: RollbackTransactionDto): Promise<any>;
}
