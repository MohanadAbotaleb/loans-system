import { Test, TestingModule } from '@nestjs/testing';
import { RollbacksService } from './rollbacks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { mockPrismaService, clearMocks } from '../../test/test-helpers';

describe('RollbacksService', () => {
  let service: RollbacksService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    clearMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbacksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RollbacksService>(RollbacksService);
    prisma = mockPrismaService;
  });

  describe('rollbackTransaction', () => {
    const testData = {
      transactionId: 'disbursement-123',
      reason: 'Test rollback',
    };

    it('should successfully rollback a disbursement', async () => {
      const mockDisbursement = {
        id: testData.transactionId,
        loanId: 'loan-123',
        status: 'completed',
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findFirst: jest.fn().mockResolvedValue(mockDisbursement),
            update: jest.fn().mockResolvedValue({ ...mockDisbursement, status: 'rolled_back' }),
          },
          payment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          repaymentSchedule: {
            updateMany: jest.fn().mockResolvedValue({ count: 12 }),
          },
          loan: {
            update: jest.fn().mockResolvedValue({}),
          },
          rollbackRecord: {
            create: jest.fn().mockResolvedValue({
              id: 'rollback-123',
              transactionId: testData.transactionId,
              originalOperation: 'disbursement',
            }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.rollbackTransaction(testData);

      expect(result).toBeDefined();
      expect(result.originalOperation).toBe('disbursement');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should successfully rollback a payment', async () => {
      const mockPayment = {
        id: testData.transactionId,
        loanId: 'loan-123',
        status: 'completed',
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          payment: {
            findFirst: jest.fn().mockResolvedValue(mockPayment),
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({ ...mockPayment, status: 'rolled_back' }),
          },
          loan: {
            findUnique: jest.fn().mockResolvedValue({
              id: mockPayment.loanId,
              amount: 10000,
            }),
          },
          repaymentSchedule: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'schedule-1',
                loanId: mockPayment.loanId,
                principalAmount: 800,
                status: 'pending',
              },
            ]),
            update: jest.fn().mockResolvedValue({}),
            count: jest.fn().mockResolvedValue(0),
          },
          rollbackRecord: {
            create: jest.fn().mockResolvedValue({
              id: 'rollback-123',
              transactionId: testData.transactionId,
              originalOperation: 'payment',
            }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.rollbackTransaction(testData);

      expect(result).toBeDefined();
      expect(result.originalOperation).toBe('payment');
    });

    it('should throw NotFoundException if transaction not found', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          payment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(service.rollbackTransaction(testData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if transaction already rolled back', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findFirst: jest.fn().mockResolvedValue({
              id: testData.transactionId,
              loanId: 'loan-123',
              status: 'rolled_back',
              rolledBackAt: new Date(),
            }),
          },
          payment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
      });

      await expect(service.rollbackTransaction(testData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should create audit log after successful rollback', async () => {
      const createAuditSpy = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findFirst: jest.fn().mockResolvedValue({
              id: testData.transactionId,
              status: 'completed',
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          payment: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
          repaymentSchedule: {
            updateMany: jest.fn().mockResolvedValue({ count: 12 }),
          },
          loan: {
            update: jest.fn().mockResolvedValue({}),
          },
          rollbackRecord: {
            create: jest.fn().mockResolvedValue({ id: 'rollback-123' }),
          },
          auditLog: {
            create: createAuditSpy,
          },
        });
      });

      await service.rollbackTransaction(testData);

      expect(createAuditSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          operation: 'disbursement_rollback',
          transactionId: testData.transactionId,
        }),
      });
    });
  });
});
