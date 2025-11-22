import { Controller, Post, Body, HttpCode, HttpStatus, Get, Res, Param } from '@nestjs/common';
import { RepaymentsService } from './repayments.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import type { Response } from 'express';

@Controller('repayments')
export class RepaymentsController {
    constructor(private readonly repaymentsService: RepaymentsService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const { data, count } = await this.repaymentsService.findAll();
        res.set('Content-Range', `repayments 0 - ${count}/${count}`);
        res.set('X-Total-Count', count.toString());
        return res.json(data);
    }

    @Get(':loanId')
    async getHistory(@Param('loanId') loanId: string) {
        return this.repaymentsService.getHistory(loanId);
    }

    @Get(':loanId/schedule')
    async getSchedule(@Param('loanId') loanId: string) {
        return this.repaymentsService.getSchedule(loanId);
    }

    @Get(':loanId/calculate')
    async calculateDue(@Param('loanId') loanId: string) {
        return this.repaymentsService.calculateDue(loanId);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createRepaymentDto: CreateRepaymentDto) {
        return this.repaymentsService.recordRepayment(createRepaymentDto);
    }
}
