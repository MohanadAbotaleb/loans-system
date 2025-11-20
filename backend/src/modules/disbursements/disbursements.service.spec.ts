import { Test, TestingModule } from '@nestjs/testing';
import { DisbursementsService } from './disbursements.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLogger } from '../../common/logger/app.logger';
import { AuditService } from '../../modules/audit/audit.service';
import { ConflictException } from '@nestjs/common';

describe('DisbursementsService', () => {
  let service: DisbursementsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    disbursement: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    loan: {
      upsert: jest.fn(),
    },
    repaymentSchedule: {
      createMany: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisbursementsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DisbursementsService>(DisbursementsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('disburseLoan', () => {
    const dto = {
      loanId: 'loan-1',
      borrowerId: 'user-1',
      amount: 10000,
      currency: 'USD',
      tenor: 12,
      interestRate: 10,
    };

    it('should successfully disburse a loan', async () => {
      mockPrismaService.disbursement.findUnique.mockResolvedValue(null);
      mockPrismaService.loan.upsert.mockResolvedValue({ id: 'loan-1' });
      mockPrismaService.disbursement.create.mockResolvedValue({
        id: 'disb-1',
        disbursementDate: new Date(),
      });

      const result = await service.disburseLoan(dto);

      expect(result.disbursement.id).toBe('disb-1');
      expect(mockPrismaService.repaymentSchedule.createMany).toHaveBeenCalled();
      expect(mockAuditService.logAction).toHaveBeenCalled();
    });

    it('should throw ConflictException if loan already disbursed', async () => {
      mockPrismaService.disbursement.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.disburseLoan(dto)).rejects.toThrow(ConflictException);
    });
  });
});
