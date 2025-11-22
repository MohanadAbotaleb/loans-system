import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Repayment Logic Reproduction (e2e)', () => {
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
                amount: 12000,
                currency: 'USD',
                tenor: 12,
                interestRate: 10,
            });

        testLoanId = loanId;
    });

    it('should update repayment schedule status after full payment of installment', async () => {
        // 1. Get the schedule
        const scheduleRes = await request(app.getHttpServer())
            .get(`/repayments/${testLoanId}/schedule`)
            .expect(200);

        const firstInstallment = scheduleRes.body[0];
        const totalDue = Number(firstInstallment.principalAmount) + Number(firstInstallment.interestAmount);

        console.log('First Installment Due:', totalDue);

        // 2. Make a payment covering the first installment
        await request(app.getHttpServer())
            .post('/repayments')
            .send({
                loanId: testLoanId,
                amount: totalDue + 1, // Add a bit extra to cover any daily interest diffs
            })
            .expect(201);

        // 3. Get the schedule again
        const scheduleResAfter = await request(app.getHttpServer())
            .get(`/repayments/${testLoanId}/schedule`)
            .expect(200);

        const firstInstallmentAfter = scheduleResAfter.body[0];

        // 4. Assert that the status is 'paid' (or similar)
        // Currently, the code DOES NOT update this, so we expect this to fail if the bug exists.
        // Or we can assert it IS 'pending' to prove the bug, but usually we write tests for desired behavior.
        // Let's assert it should be 'paid' or 'completed'.
        expect(firstInstallmentAfter.status).toBe('paid');
    });
});
