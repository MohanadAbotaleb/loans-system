import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppLogger } from './common/logger/app.logger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors();

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Logging
  // We already registered LoggingInterceptor globally in CommonModule? 
  // If so, we don't need to useGlobalInterceptors here unless we want it outside DI.
  // But CommonModule exports it and it is a provider. 
  // Wait, LoggingInterceptor needs to be bound with APP_INTERCEPTOR or useGlobalInterceptors with DI.
  // In CommonModule, I exported it but didn't bind it as APP_INTERCEPTOR.
  // I will bind it in CommonModule or here.
  // Binding here requires getting the instance.
  // Better to bind in CommonModule with APP_INTERCEPTOR token if I want DI.
  // Or just: app.useGlobalInterceptors(app.get(LoggingInterceptor));
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
