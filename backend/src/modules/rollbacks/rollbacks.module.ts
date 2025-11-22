import { Module } from '@nestjs/common';
import { RollbacksService } from './rollbacks.service';
import { RollbacksController } from './rollbacks.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RollbacksController],
  providers: [RollbacksService],
  exports: [RollbacksService],
})
export class RollbacksModule { }
