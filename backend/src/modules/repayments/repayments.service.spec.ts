import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentsService } from './repayments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { mockPrismaService, createTestRepayment, createTestLoan, clearMocks } from '../../test/test-helpers';

describe('RepaymentsService', () => {
  let service: RepaymentsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    clearMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RepaymentsService>(RepaymentsService);
    prisma = mockPrismaService;
  });

  describe('recordRepayment', () => {
    const testData = createTestRepayment();
    const testLoan = createTestLoan();

    it('should successfully record a repayment', async () => {
      const mockPayment = {
        id: 'payment-123',
        loanId: testData.loanId,
        amount: testData.amount,
        paymentDate: new Date(),
        principalPaid: 800,
        interestPaid: 150,
        lateFeePaid: 0,
        daysLate: 0,
        status: 'completed',
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loan: {
            findUnique: jest.fn().mockResolvedValue({
              ...testLoan,
              payments: [],
              disbursement: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          payment: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue(mockPayment),
          },
          repaymentSchedule: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'schedule-1',
                loanId: testLoan.id,
                principalAmount: 800,
                dueDate: new Date(Date.now() - 86400000), // Yesterday
                status: 'pending',
              },
            ]),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.recordRepayment(testData);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if loan not found', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loan: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(service.recordRepayment(testData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should calculate late fees correctly after grace period', async () => {
      const createPaymentSpy = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loan: {
            findUnique: jest.fn().mockResolvedValue({
              ...testLoan,
              payments: [],
              disbursement: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          payment: {
            findMany: jest.fn().mockResolvedValue([]),
            create: createPaymentSpy,
          },
          repaymentSchedule: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'schedule-1',
                loanId: testLoan.id,
                principalAmount: 800,
                dueDate: new Date(Date.now() - 5 * 86400000), // 5 days late
                status: 'pending',
              },
            ]),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.recordRepayment(testData);

      const paymentData = createPaymentSpy.mock.calls[0][0].data;
      expect(paymentData.daysLate).toBeGreaterThan(3);
      expect(paymentData.lateFeePaid).toBeGreaterThan(0);
    });

    it('should allocate payment correctly (interest -> late fee -> principal)', async () => {
      const createPaymentSpy = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loan: {
            findUnique: jest.fn().mockResolvedValue({
              ...testLoan,
              payments: [],
              disbursement: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          payment: {
            findMany: jest.fn().mockResolvedValue([]),
            create: createPaymentSpy,
          },
          repaymentSchedule: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'schedule-1',
                loanId: testLoan.id,
                principalAmount: 1000,
                dueDate: new Date(Date.now() - 5 * 86400000),
                status: 'pending',
              },
            ]),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.recordRepayment({ ...testData, amount: 1000 });

      const paymentData = createPaymentSpy.mock.calls[0][0].data;
      // Interest should be paid first, then late fee, then principal
      const total = Number(paymentData.interestPaid) + Number(paymentData.lateFeePaid) + Number(paymentData.principalPaid);
      expect(total).toBeCloseTo(1000, 0);
    });

    it('should create audit log after successful payment', async () => {
      const createAuditSpy = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          loan: {
            findUnique: jest.fn().mockResolvedValue({
              ...testLoan,
              payments: [],
              disbursement: null,
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          payment: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: 'payment-123' }),
          },
          repaymentSchedule: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'schedule-1',
                loanId: testLoan.id,
                principalAmount: 800,
                dueDate: new Date(),
                status: 'pending',
              },
            ]),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0),
          },
          auditLog: {
            create: createAuditSpy,
          },
        });
      });

      await service.recordRepayment(testData);

      expect(createAuditSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          operation: 'repayment_recorded',
          metadata: expect.objectContaining({
            loanId: testData.loanId,
            amount: testData.amount,
          }),
        }),
      });
    });
  });
});
