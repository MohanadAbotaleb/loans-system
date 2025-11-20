import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from '../logger/app.logger';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    constructor(private readonly logger: AppLogger) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        if (context.getType() !== 'http') {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const { method, url, body } = request;
        const transactionId = request.headers['x-transaction-id'] || uuidv4();
        request.headers['x-transaction-id'] = transactionId; // Attach for downstream use

        const now = Date.now();
        this.logger.log(`Incoming Request: ${method} ${url}`, 'HTTP', {
            transactionId,
            method,
            url,
            body: this.sanitizeBody(body),
        });

        return next.handle().pipe(
            tap({
                next: (data) => {
                    this.logger.log(`Request Completed: ${method} ${url}`, 'HTTP', {
                        transactionId,
                        duration: Date.now() - now,
                        statusCode: context.switchToHttp().getResponse().statusCode,
                    });
                },
                error: (error) => {
                    this.logger.error(`Request Failed: ${method} ${url}`, error.stack, 'HTTP', {
                        transactionId,
                        duration: Date.now() - now,
                        error: error.message,
                    });
                },
            }),
        );
    }

    private sanitizeBody(body: any): any {
        if (!body) return body;
        const sanitized = { ...body };
        // Redact sensitive fields
        const sensitiveFields = ['password', 'token', 'secret'];
        sensitiveFields.forEach((field) => {
            if (field in sanitized) {
                sanitized[field] = '***';
            }
        });
        return sanitized;
    }
}
