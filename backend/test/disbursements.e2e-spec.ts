import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Disbursements (e2e)', () => {
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
        // Clean database before each test
        await prisma.auditLog.deleteMany();
        await prisma.rollbackRecord.deleteMany();
        await prisma.payment.deleteMany();
        await prisma.repaymentSchedule.deleteMany();
        await prisma.disbursement.deleteMany();
        await prisma.loan.deleteMany();
    });

    describe('POST /disbursements', () => {
        it('should create a new disbursement', () => {
            return request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId: '550e8400-e29b-41d4-a716-446655440000',
                    borrowerId: '550e8400-e29b-41d4-a716-446655440001',
                    amount: 10000,
                    currency: 'USD',
                    tenor: 12,
                    interestRate: 12,
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.status).toBe('completed');
                    expect(res.body.loanId).toBe('550e8400-e29b-41d4-a716-446655440000');
                });
        });

        it('should reject duplicate disbursement', async () => {
            const data = {
                loanId: '550e8400-e29b-41d4-a716-446655440002',
                borrowerId: '550e8400-e29b-41d4-a716-446655440001',
                amount: 10000,
                currency: 'USD',
                tenor: 12,
                interestRate: 12,
            };

            // Create first disbursement
            await request(app.getHttpServer())
                .post('/disbursements')
                .send(data)
                .expect(201);

            // Try to create duplicate
            return request(app.getHttpServer())
                .post('/disbursements')
                .send(data)
                .expect(409);
        });

        it('should reject invalid data', () => {
            return request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId: 'not-a-uuid',
                    amount: -1000, // Negative amount
                })
                .expect(400);
        });

        it('should create audit log entry', async () => {
            await request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId: '550e8400-e29b-41d4-a716-446655440003',
                    borrowerId: '550e8400-e29b-41d4-a716-446655440001',
                    amount: 10000,
                    currency: 'USD',
                    tenor: 12,
                    interestRate: 12,
                })
                .expect(201);

            const auditLogs = await prisma.auditLog.findMany();
            expect(auditLogs.length).toBe(1);
            expect(auditLogs[0].operation).toBe('disbursement_created');
        });
    });

    describe('GET /disbursements', () => {
        it('should return list of disbursements with pagination headers', async () => {
            // Create a disbursement first
            await request(app.getHttpServer())
                .post('/disbursements')
                .send({
                    loanId: '550e8400-e29b-41d4-a716-446655440004',
                    borrowerId: '550e8400-e29b-41d4-a716-446655440001',
                    amount: 10000,
                    currency: 'USD',
                    tenor: 12,
                    interestRate: 12,
                });

            return request(app.getHttpServer())
                .get('/disbursements')
                .expect(200)
                .expect((res) => {
                    expect(res.headers['content-range']).toBeDefined();
                    expect(res.headers['x-total-count']).toBe('1');
                    expect(Array.isArray(res.body)).toBe(true);
                });
        });
    });
});
