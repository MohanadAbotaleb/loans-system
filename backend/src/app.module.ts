import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DisbursementsModule } from './disbursements/disbursements.module';
import { RepaymentsModule } from './repayments/repayments.module';
import { RollbacksModule } from './rollbacks/rollbacks.module';
import { AuditModule } from './audit/audit.module';
import { LoansModule } from './loans/loans.module';
import { PrismaModule } from './prisma/prisma.module';

import { HealthController } from './health/health.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    DisbursementsModule,
    RepaymentsModule,
    RollbacksModule,
    LoansModule,
    AuditModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule { }
