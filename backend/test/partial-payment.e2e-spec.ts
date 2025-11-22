import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Partial Payment Reproduction (e2e)', () => {
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
        // Amount 1200, 12 months -> 100 principal per month
        const loanId = '550e8400-e29b-41d4-a716-446655440070';
        await request(app.getHttpServer())
            .post('/disbursements')
            .send({
                loanId,
                borrowerId: '550e8400-e29b-41d4-a716-446655440071',
                amount: 1200,
                currency: 'USD',
                tenor: 12,
                interestRate: 0, // 0 interest to simplify calculation
            });

        testLoanId = loanId;
    });

    it('should mark schedule as paid after two partial payments', async () => {
        // 1. Get the first schedule
        const schedulesBefore = await prisma.repaymentSchedule.findMany({
            where: { loanId: testLoanId },
            orderBy: { dueDate: 'asc' }
        });
        const firstSchedule = schedulesBefore[0];
        expect(Number(firstSchedule.principalAmount)).toBe(100);

        // 2. Make first partial payment (50)
        await request(app.getHttpServer())
            .post('/repayments')
            .send({
                loanId: testLoanId,
                amount: 50,
            })
            .expect(201);

        // 3. Check status - should still be pending
        const scheduleAfterFirst = await prisma.repaymentSchedule.findUnique({
            where: { id: firstSchedule.id }
        });
        expect(scheduleAfterFirst.status).toBe('pending');

        // 4. Make second partial payment (50)
        await request(app.getHttpServer())
            .post('/repayments')
            .send({
                loanId: testLoanId,
                amount: 50,
            })
            .expect(201);

        // 5. Check status - SHOULD be paid now
        const scheduleAfterSecond = await prisma.repaymentSchedule.findUnique({
            where: { id: firstSchedule.id }
        });

        // This expectation is expected to fail with the current logic
        expect(scheduleAfterSecond.status).toBe('paid');
    });
});
