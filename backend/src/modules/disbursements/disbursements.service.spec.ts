import { Test, TestingModule } from '@nestjs/testing';
import { DisbursementsService } from './disbursements.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { mockPrismaService, createTestDisbursement, clearMocks } from '../../test/test-helpers';

describe('DisbursementsService', () => {
  let service: DisbursementsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    clearMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisbursementsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DisbursementsService>(DisbursementsService);
    prisma = mockPrismaService;
  });

  describe('disburseLoan', () => {
    const testData = createTestDisbursement();

    it('should successfully disburse a loan', async () => {
      const mockDisbursement = {
        id: 'disbursement-123',
        loanId: testData.loanId,
        amount: testData.amount,
        disbursementDate: new Date(),
        status: 'completed',
        createdAt: new Date(),
      };

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue(mockDisbursement),
          },
          loan: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: testData.loanId,
              ...testData,
              status: 'active',
            }),
          },
          repaymentSchedule: {
            createMany: jest.fn().mockResolvedValue({ count: 12 }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.disburseLoan(testData);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if loan already disbursed', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'existing',
              status: 'completed',
            }),
          },
        });
      });

      await expect(service.disburseLoan(testData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create repayment schedule with correct number of installments', async () => {
      const createManySpy = jest.fn().mockResolvedValue({ count: testData.tenor });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'disbursement-123',
              loanId: testData.loanId,
              amount: testData.amount,
              disbursementDate: new Date(),
              status: 'completed',
            }),
          },
          loan: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: testData.loanId,
              status: 'active',
            }),
          },
          repaymentSchedule: {
            createMany: createManySpy,
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.disburseLoan(testData);

      expect(createManySpy).toHaveBeenCalled();
      const scheduleData = createManySpy.mock.calls[0][0].data;
      expect(scheduleData).toHaveLength(testData.tenor);
    });

    it('should create audit log after successful disbursement', async () => {
      const createAuditSpy = jest.fn().mockResolvedValue({});

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'disbursement-123',
              status: 'completed',
            }),
          },
          loan: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ id: testData.loanId }),
          },
          repaymentSchedule: {
            createMany: jest.fn().mockResolvedValue({ count: 12 }),
          },
          auditLog: {
            create: createAuditSpy,
          },
        });
      });

      await service.disburseLoan(testData);

      expect(createAuditSpy).toHaveBeenCalledWith({
        data: expect.objectContaining({
          operation: 'disbursement_created',
          metadata: expect.objectContaining({
            loanId: testData.loanId,
            amount: testData.amount,
          }),
        }),
      });
    });

    it('should handle zero-interest loans', async () => {
      const zeroInterestData = {
        ...testData,
        interestRate: 0,
      };
      const createManySpy = jest.fn().mockResolvedValue({ count: zeroInterestData.tenor });

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'disbursement-123',
              loanId: zeroInterestData.loanId,
              amount: zeroInterestData.amount,
              disbursementDate: new Date(),
              status: 'completed',
            }),
          },
          loan: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: zeroInterestData.loanId,
              status: 'active',
            }),
          },
          repaymentSchedule: {
            createMany: createManySpy,
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.disburseLoan(zeroInterestData);

      expect(createManySpy).toHaveBeenCalled();
      const scheduleData = createManySpy.mock.calls[0][0].data;
      expect(scheduleData).toHaveLength(zeroInterestData.tenor);
      expect(scheduleData[0].interestAmount).toBe(0);
      expect(scheduleData[0].principalAmount).toBe(zeroInterestData.amount / zeroInterestData.tenor);
    });

    it('should use existing loan if it exists', async () => {
      const existingLoan = {
        id: testData.loanId,
        borrowerId: testData.borrowerId,
        amount: testData.amount,
        interestRate: testData.interestRate,
        tenor: testData.tenor,
        status: 'active',
      };
      const findUniqueSpy = jest.fn().mockResolvedValue(existingLoan);

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          disbursement: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              id: 'disbursement-123',
              status: 'completed',
            }),
          },
          loan: {
            findUnique: findUniqueSpy,
          },
          repaymentSchedule: {
            createMany: jest.fn().mockResolvedValue({ count: 12 }),
          },
          auditLog: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.disburseLoan(testData);

      expect(findUniqueSpy).toHaveBeenCalledWith({ where: { id: testData.loanId } });
    });
  });

  describe('findAll', () => {
    it('should return all disbursements with count', async () => {
      const mockDisbursements = [
        {
          id: 'disbursement-1',
          loanId: 'loan-1',
          amount: 10000,
          status: 'completed',
        },
      ];

      prisma.disbursement.count.mockResolvedValue(1);
      prisma.disbursement.findMany.mockResolvedValue(mockDisbursements);

      const result = await service.findAll();

      expect(result.data).toEqual(mockDisbursements);
      expect(result.count).toBe(1);
      expect(prisma.disbursement.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
