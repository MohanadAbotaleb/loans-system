import { Controller, Get, Param, Res, NotFoundException, Query } from '@nestjs/common';
import { LoansService } from './loans.service';
import type { Response } from 'express';

@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Get()
    async findAll(@Res() res: Response, @Query('status') status?: string, @Query('excludeRolledBack') excludeRolledBack?: string) {
        const { data, count } = await this.loansService.findAll({
            status,
            excludeRolledBack: excludeRolledBack === 'true'
        });
        res.set('Content-Range', `loans 0-${count}/${count}`);
        res.set('X-Total-Count', count.toString());
        return res.json(data);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const loan = await this.loansService.findOne(id);
        if (!loan) {
            throw new NotFoundException(`Loan with ID ${id} not found`);
        }
        return loan;
    }

    @Get(':id/audit-trail')
    async getAuditTrail(@Param('id') id: string) {
        return this.loansService.getAuditTrail(id);
    }
}
