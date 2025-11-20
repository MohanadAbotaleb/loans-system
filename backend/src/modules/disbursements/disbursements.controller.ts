import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';

@Controller('disbursements')
export class DisbursementsController {
    constructor(private readonly disbursementsService: DisbursementsService) { }

    @Get()
    findAll() {
        return this.disbursementsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.disbursementsService.findOne(id);
    }

    @Post()
    create(@Body() createDisbursementDto: CreateDisbursementDto) {
        return this.disbursementsService.disburseLoan(createDisbursementDto);
    }
}
