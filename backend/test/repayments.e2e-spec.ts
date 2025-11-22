import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Repayments (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let testLoanId: string;

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

        // Create a test loan with disbursement
        const loanId = '550e8400-e29b-41d4-a716-446655440050';
        await request(app.getHttpServer())
            .post('/disbursements')
            .send({
                loanId,
                borrowerId: '550e8400-e29b-41d4-a716-446655440051',
                amount: 10000,
                currency: 'USD',
                tenor: 12,
                interestRate: 12,
            });

        testLoanId = loanId;
    });

    describe('POST /repayments', () => {
        it('should record a payment', () => {
            return request(app.getHttpServer())
                .post('/repayments')
                .send({
                    loanId: testLoanId,
                    amount: 1000,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.status).toBe('completed');
                    expect(res.body.loanId).toBe(testLoanId);
                    expect(res.body.amount).toBe('1000');
                });
        });

        it('should calculate payment allocation correctly', async () => {
            const response = await request(app.getHttpServer())
                .post('/repayments')
                .send({
                    loanId: testLoanId,
                    amount: 1000,
                })
                .expect(201);

            // Verify allocation fields exist
            expect(response.body.principalPaid).toBeDefined();
            expect(response.body.interestPaid).toBeDefined();
            expect(response.body.lateFeePaid).toBeDefined();
        });

        it('should reject payment for non-existent loan', () => {
            return request(app.getHttpServer())
                .post('/repayments')
                .send({
                    loanId: '550e8400-e29b-41d4-a716-446655440099',
                    amount: 1000,
                })
                .expect(404);
        });

        it('should create audit log entry', async () => {
            // Clear existing audit logs
            await prisma.auditLog.deleteMany();

            await request(app.getHttpServer())
                .post('/repayments')
                .send({
                    loanId: testLoanId,
                    amount: 1000,
                })
                .expect(201);

            const auditLogs = await prisma.auditLog.findMany({
                where: { operation: 'repayment_recorded' }
            });
            expect(auditLogs.length).toBeGreaterThan(0);
        });
    });

    describe('GET /repayments', () => {
        it('should return list of payments with pagination headers', async () => {
            // Create a payment first
            await request(app.getHttpServer())
                .post('/repayments')
                .send({
                    loanId: testLoanId,
                    amount: 1000,
                });

            return request(app.getHttpServer())
                .get('/repayments')
                .expect(200)
                .expect((res) => {
                    expect(res.headers['content-range']).toBeDefined();
                    expect(res.headers['x-total-count']).toBeDefined();
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });
});
