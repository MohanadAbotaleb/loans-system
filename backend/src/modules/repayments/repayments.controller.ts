import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { RepaymentsService } from './repayments.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';

@Controller('repayments')
export class RepaymentsController {
    constructor(private readonly repaymentsService: RepaymentsService) { }

    @Get()
    findAll(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.repaymentsService.findAll(
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.repaymentsService.findOne(id);
    }

    @Post()
    create(@Body() createRepaymentDto: CreateRepaymentDto) {
        return this.repaymentsService.processRepayment(createRepaymentDto);
    }
}
