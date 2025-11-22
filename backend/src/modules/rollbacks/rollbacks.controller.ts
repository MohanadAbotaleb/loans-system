import { Controller, Post, Body, HttpCode, HttpStatus, Get, Res } from '@nestjs/common';
import { RollbacksService } from './rollbacks.service';
import { RollbackTransactionDto } from './dto/rollback-transaction.dto';
import type { Response } from 'express';

@Controller('rollbacks')
export class RollbacksController {
    constructor(private readonly rollbacksService: RollbacksService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const { data, count } = await this.rollbacksService.findAll();
        res.set('Content-Range', `rollbacks 0-${count}/${count}`);
        res.set('X-Total-Count', count.toString());
        return res.json(data);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() rollbackTransactionDto: RollbackTransactionDto) {
        return this.rollbacksService.rollbackTransaction(rollbackTransactionDto);
    }
}
