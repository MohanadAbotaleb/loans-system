import { Module, Global } from '@nestjs/common';
import { AppLogger } from './logger/app.logger';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Global()
@Module({
  providers: [
    AppLogger,
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  exports: [AppLogger, LoggingInterceptor],
})
export class CommonModule { }
