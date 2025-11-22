import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { mockPrismaService, clearMocks } from '../../test/test-helpers';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    clearMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = mockPrismaService;
  });

  describe('getAuditTrail', () => {
    it('should retrieve audit logs for a transaction', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          transactionId: 'txn-123',
          operation: 'disbursement_created',
          userId: null,
          metadata: {},
          createdAt: new Date(),
        },
      ];

      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await service.getAuditTrail('txn-123');

      expect(result).toEqual(mockAuditLogs);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: { transactionId: 'txn-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array if no audit logs found', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);

      const result = await service.getAuditTrail('nonexistent-txn');

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should retrieve all audit logs with count', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          transactionId: 'txn-123',
          operation: 'disbursement_created',
          createdAt: new Date(),
        },
        {
          id: 'audit-2',
          transactionId: 'txn-124',
          operation: 'repayment_recorded',
          createdAt: new Date(),
        },
      ];

      prisma.auditLog.count.mockResolvedValue(2);
      prisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await service.findAll();

      expect(result.data).toEqual(mockAuditLogs);
      expect(result.count).toBe(2);
    });
  });

  describe('createAuditLog', () => {
    it('should create a new audit log entry', async () => {
      const testData = {
        transactionId: 'txn-123',
        operation: 'disbursement_created',
        userId: 'user-123',
        metadata: { amount: 10000 },
      };

      const mockAuditLog = {
        id: 'audit-1',
        ...testData,
        createdAt: new Date(),
      };

      prisma.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(testData);

      expect(result).toEqual(mockAuditLog);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: testData,
      });
    });
  });
});
