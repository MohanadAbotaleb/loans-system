import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'error' },
                { emit: 'event', level: 'warn' },
            ],
        });
    }

    async onModuleInit() {
        // Connect to database
        await this.$connect();
        this.logger.log('Database connected successfully');

        // Listen to query events for detailed logging
        this.$on('query' as never, (e: any) => {
            this.logger.debug(`Query: ${e.query}`, {
                duration: `${e.duration}ms`,
                params: e.params,
            });

            // Log slow queries (> 1000ms)
            if (e.duration > 1000) {
                this.logger.warn(
                    `Slow query detected: ${e.query}`,
                    { duration: `${e.duration}ms`, params: e.params }
                );
            }
        });

        this.$on('error' as never, (e: any) => {
            this.logger.error(`Database error: ${e.message}`, e.target);
        });

        this.$on('warn' as never, (e: any) => {
            this.logger.warn(`Database warning: ${e.message}`, e.target);
        });
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
}
