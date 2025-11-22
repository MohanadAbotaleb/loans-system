import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService, clearMocks } from '../../test/test-helpers';

describe('LoansService', () => {
  let service: LoansService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    clearMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    prisma = mockPrismaService;
  });

  describe('findAll', () => {
    it('should return all loans', async () => {
      const mockLoans = [
        {
          id: 'loan-1',
          borrowerId: 'borrower-1',
          amount: 10000,
          interestRate: 12,
          tenor: 12,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          disbursement: null,
        },
      ];

      prisma.loan.count.mockResolvedValue(1);
      prisma.loan.findMany.mockResolvedValue(mockLoans);

      const result = await service.findAll();

      expect(result.data).toEqual(mockLoans);
      expect(result.count).toBe(1);
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: {},
        include: { disbursement: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by status', async () => {
      prisma.loan.count.mockResolvedValue(0);
      prisma.loan.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'active' });

      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: { status: 'active' },
        include: { disbursement: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should exclude rolled back loans', async () => {
      prisma.loan.count.mockResolvedValue(0);
      prisma.loan.findMany.mockResolvedValue([]);

      await service.findAll({ excludeRolledBack: true });

      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: {
          disbursement: {
            rolledBackAt: null,
          },
        },
        include: { disbursement: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should combine filters', async () => {
      prisma.loan.count.mockResolvedValue(0);
      prisma.loan.findMany.mockResolvedValue([]);

      await service.findAll({ status: 'active', excludeRolledBack: true });

      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          disbursement: {
            rolledBackAt: null,
          },
        },
        include: { disbursement: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a loan with payments and disbursement', async () => {
      const mockLoan = {
        id: 'loan-1',
        borrowerId: 'borrower-1',
        amount: 10000,
        interestRate: 12,
        tenor: 12,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        payments: [],
        disbursement: null,
      };

      prisma.loan.findUnique.mockResolvedValue(mockLoan);

      const result = await service.findOne('loan-1');

      expect(result).toEqual(mockLoan);
      expect(prisma.loan.findUnique).toHaveBeenCalledWith({
        where: { id: 'loan-1' },
        include: {
          payments: true,
          disbursement: true,
        },
      });
    });

    it('should return null if loan not found', async () => {
      prisma.loan.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit logs for loan transactions', async () => {
      const mockLoan = {
        id: 'loan-1',
        disbursement: { id: 'disbursement-1' },
        payments: [
          { id: 'payment-1' },
          { id: 'payment-2' },
        ],
      };

      const mockAuditLogs = [
        {
          id: 'audit-1',
          transactionId: 'disbursement-1',
          operation: 'disbursement_created',
          createdAt: new Date(),
        },
      ];

      prisma.loan.findUnique.mockResolvedValue(mockLoan as any);
      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await service.getAuditTrail('loan-1');

      expect(result).toEqual(mockAuditLogs);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          transactionId: {
            in: ['disbursement-1', 'payment-1', 'payment-2'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if loan not found', async () => {
      prisma.loan.findUnique.mockResolvedValue(null);

      const result = await service.getAuditTrail('non-existent');

      expect(result).toEqual([]);
      expect(prisma.auditLog.findMany).not.toHaveBeenCalled();
    });

    it('should handle loan without disbursement', async () => {
      const mockLoan = {
        id: 'loan-1',
        disbursement: null,
        payments: [{ id: 'payment-1' }],
      };

      prisma.loan.findUnique.mockResolvedValue(mockLoan as any);
      prisma.auditLog.findMany.mockResolvedValue([]);

      await service.getAuditTrail('loan-1');

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          transactionId: {
            in: ['payment-1'],
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});

