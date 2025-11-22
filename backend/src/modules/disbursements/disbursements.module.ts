import { Module } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { DisbursementsController } from './disbursements.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { RollbacksModule } from '../rollbacks/rollbacks.module';

@Module({
  imports: [PrismaModule, RollbacksModule],
  controllers: [DisbursementsController],
  providers: [DisbursementsService],
})
export class DisbursementsModule { }
