import { Module } from '@nestjs/common';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsService } from './repayments.service';

@Module({
  controllers: [RepaymentsController],
  providers: [RepaymentsService]
})
export class RepaymentsModule {}
