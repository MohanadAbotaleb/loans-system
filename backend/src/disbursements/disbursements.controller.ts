import { Controller, Post, Body, Get, Res, Param } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import type { Response } from 'express';
import { RollbacksService } from '../rollbacks/rollbacks.service';

@Controller('disbursements')
export class DisbursementsController {
    constructor(
        private readonly disbursementsService: DisbursementsService,
        private readonly rollbacksService: RollbacksService
    ) { }

    @Post()
    create(@Body() createDisbursementDto: CreateDisbursementDto) {
        return this.disbursementsService.disburseLoan(createDisbursementDto);
    }

    @Get()
    async findAll(@Res() res: Response) {
        const { data, count } = await this.disbursementsService.findAll();
        res.set('Content-Range', `disbursements 0-${count}/${count}`);
        res.set('X-Total-Count', count.toString());
        return res.json(data);
    }

    @Post(':id/rollback')
    async rollback(@Param('id') id: string, @Body() body: { reason: string }) {
        return this.rollbacksService.rollbackTransaction({
            transactionId: id,
            reason: body.reason || 'Manual rollback via API'
        });
    }
}
