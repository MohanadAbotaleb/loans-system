import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Audit (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = moduleFixture.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(async () => {
        // Clean database
        await prisma.auditLog.deleteMany();
        await prisma.rollbackRecord.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.repaymentSchedule.deleteMany();
        await prisma.disbursement.deleteMany();
        await prisma.loan.deleteMany();
    });

    describe('GET /audit', () => {
        it('should return empty list when no audit logs exist', () => {
            return request(app.getHttpServer())
                .get('/audit')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBe(0);
                    expect(res.headers['x-total-count']).toBe('0');
                });
        });

        it('should return audit logs created by operations', async () => {
            // Create a disbursement (which creates an audit log)
            await request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId: '550e8400-e29b-41d4-a716-446655440060',
                    borrowerId: '550e8400-e29b-41d4-a716-446655440061',
                    amount: 10000,
                    currency: 'USD',
                    tenor: 12,
                    interestRate: 12,
                });

            return request(app.getHttpServer())
                .get('/audit')
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBeGreaterThan(0);
                    expect(res.body[0].operation).toBe('disbursement_created');
                    expect(res.headers['content-range']).toBeDefined();
                });
        });

        it('should track multiple operations in audit log', async () => {
            const loanId = '550e8400-e29b-41d4-a716-446655440062';

            // Create disbursement
            await request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId,
                    borrowerId: '550e8400-e29b-41d4-a716-446655440063',
                    amount: 10000,
                    currency: 'USD',
                    tenor: 12,
                    interestRate: 12,
                });

            // Record payment
            await request(app.getHttpServer())
                .post('/repayments')
                .send({
                    loanId,
                    amount: 1000,
                });

            const response = await request(app.getHttpServer())
                .get('/audit')
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(2);
            const operations = response.body.map((log: any) => log.operation);
            expect(operations).toContain('disbursement_created');
            expect(operations).toContain('repayment_recorded');
        });
    });

    describe('GET /audit/:transactionId', () => {
        it('should return audit trail for specific transaction', async () => {
            // Create disbursement
            const disbursementResponse = await request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId: '550e8400-e29b-41d4-a716-446655440064',
                    borrowerId: '550e8400-e29b-41d4-a716-446655440065',
                    amount: 10000,
                    currency: 'USD',
                    tenor: 12,
                    interestRate: 12,
                });

            const transactionId = disbursementResponse.body.id;

            return request(app.getHttpServer())
                .get(`/audit/${transactionId}`)
                .expect(200)
                .expect((res) => {
                    expect(Array.isArray(res.body)).toBe(true);
                    expect(res.body.length).toBeGreaterThan(0);
                    expect(res.body[0].transactionId).toBe(transactionId);
                });
        });
    });
});
