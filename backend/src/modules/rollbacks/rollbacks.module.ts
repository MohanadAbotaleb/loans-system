import { Module } from '@nestjs/common';
import { RollbacksService } from './rollbacks.service';
import { RollbacksController } from './rollbacks.controller';

@Module({
  providers: [RollbacksService],
  controllers: [RollbacksController]
})
export class RollbacksModule {}
