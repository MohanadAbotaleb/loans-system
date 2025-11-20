import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { RollbacksService } from './rollbacks.service';

@Controller('rollbacks')
export class RollbacksController {
    constructor(private readonly rollbacksService: RollbacksService) { }

    @Post(':transactionId')
    async rollback(
        @Param('transactionId') transactionId: string,
        @Body('reason') reason: string,
    ) {
        return this.rollbacksService.rollbackTransaction(transactionId, reason);
    }

    @Get(':transactionId/can-rollback')
    async canRollback(@Param('transactionId') transactionId: string) {
        const canRollback = await this.rollbacksService.canRollback(transactionId);
        return { transactionId, canRollback };
    }

    @Get(':transactionId/audit')
    async getAuditTrail(@Param('transactionId') transactionId: string) {
        return this.rollbacksService.getAuditTrail(transactionId);
    }
}
