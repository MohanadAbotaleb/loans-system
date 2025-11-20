import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { DisbursementsModule } from './modules/disbursements/disbursements.module';
import { PrismaModule } from './prisma/prisma.module';
import { RepaymentsModule } from './modules/repayments/repayments.module';
import { AuditModule } from './modules/audit/audit.module';
import { RollbacksModule } from './modules/rollbacks/rollbacks.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LoansModule } from './modules/loans/loans.module';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    DisbursementsModule,
    RepaymentsModule,
    AuditModule,
    RollbacksModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    LoansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
