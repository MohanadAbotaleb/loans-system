import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, body } = req;
        const userAgent = req.get('user-agent') || '';
        const transactionId = uuidv4();

        // Attach transactionId to request for use in services
        req.transactionId = transactionId;

        const now = Date.now();
        this.logger.log({
            message: 'Incoming Request',
            transactionId,
            method,
            url,
            body: this.sanitizeBody(body),
            userAgent,
        });

        return next
            .handle()
            .pipe(
                tap((data) => {
                    const response = context.switchToHttp().getResponse();
                    const delay = Date.now() - now;
                    this.logger.log({
                        message: 'Outgoing Response',
                        transactionId,
                        method,
                        url,
                        statusCode: response.statusCode,
                        duration: `${delay}ms`,
                    });
                }),
            );
    }

    private sanitizeBody(body: any) {
        if (!body) return body;
        const sanitized = { ...body };
        // Redact sensitive fields if any
        return sanitized;
    }
}
