import { Controller, Get, Param } from '@nestjs/common';
import { LoansService } from './loans.service';

@Controller('loans')
export class LoansController {
    constructor(private readonly loansService: LoansService) { }

    @Get()
    findAll() {
        return this.loansService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.loansService.findOne(id);
    }
}
