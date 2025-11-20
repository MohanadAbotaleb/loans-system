import { Test, TestingModule } from '@nestjs/testing';
import { RollbacksService } from './rollbacks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppLogger } from '../../common/logger/app.logger';

describe('RollbacksService', () => {
  let service: RollbacksService;

  const mockPrismaService = {};
  const mockAuditService = {};
  const mockLogger = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RollbacksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RollbacksService>(RollbacksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
