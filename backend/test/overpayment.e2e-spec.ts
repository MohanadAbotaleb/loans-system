import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Overpayment Reproduction (e2e)', () => {
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
        const loanId = '550e8400-e29b-41d4-a716-446655440060';
        await request(app.getHttpServer())
            .post('/disbursements')
            .send({
                loanId,
                borrowerId: '550e8400-e29b-41d4-a716-446655440061',
                amount: 1000,
                currency: 'USD',
                tenor: 12,
                interestRate: 10,
            });

        testLoanId = loanId;
    });

    it('should reject payment that exceeds total outstanding balance', async () => {
        // 1. Calculate total due (approx 1000 + interest)
        // Let's try to pay 2000, which is definitely more than 1000 + interest

        await request(app.getHttpServer())
            .post('/repayments')
            .send({
                loanId: testLoanId,
                amount: 2000,
            })
            .expect(400); // Expect Bad Request
    });
});
