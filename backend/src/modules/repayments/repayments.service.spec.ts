import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentsService } from './repayments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RepaymentCalculationService } from './repayment-calculation.service';
import { AppLogger } from '../../common/logger/app.logger';
import { AuditService } from '../audit/audit.service';

describe('RepaymentsService', () => {
  let service: RepaymentsService;

  const mockPrismaService = {};
  const mockCalculationService = {};
  const mockLogger = {};
  const mockAuditService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RepaymentCalculationService, useValue: mockCalculationService },
        { provide: AppLogger, useValue: mockLogger },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<RepaymentsService>(RepaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
