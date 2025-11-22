import { Controller, Get, Param, Res } from '@nestjs/common';
import { AuditService } from './audit.service';
import type { Response } from 'express';

@Controller('audit')
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const { data, count } = await this.auditService.findAll();
        res.set('Content-Range', `audit 0-${count}/${count}`);
        res.set('X-Total-Count', count.toString());
        return res.json(data);
    }

    @Get(':transactionId')
    async getAuditTrail(@Param('transactionId') transactionId: string) {
        return this.auditService.getAuditTrail(transactionId);
    }
}
