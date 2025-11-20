import { Module } from '@nestjs/common';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsService } from './repayments.service';
import { RepaymentCalculationService } from './repayment-calculation.service';

@Module({
  controllers: [RepaymentsController],
  providers: [RepaymentsService, RepaymentCalculationService]
})
export class RepaymentsModule { }
