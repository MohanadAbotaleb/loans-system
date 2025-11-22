import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DisbursementsModule } from './modules/disbursements/disbursements.module';
import { RepaymentsModule } from './modules/repayments/repayments.module';
import { RollbacksModule } from './modules/rollbacks/rollbacks.module';
import { AuditModule } from './modules/audit/audit.module';
import { LoansModule } from './modules/loans/loans.module';
import { PrismaModule } from './prisma/prisma.module';

import { HealthController } from './modules/health/health.controller';
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
