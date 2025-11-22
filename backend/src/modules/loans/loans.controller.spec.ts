import { Test, TestingModule } from '@nestjs/testing';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { NotFoundException } from '@nestjs/common';

describe('LoansController', () => {
  let controller: LoansController;
  let service: LoansService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoansController],
      providers: [
        {
          provide: LoansService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            getAuditTrail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LoansController>(LoansController);
    service = module.get<LoansService>(LoansService);
  });

  describe('findAll', () => {
    it('should return loans with pagination headers', async () => {
      const mockData = [
        {
          id: 'loan-1',
          borrowerId: 'borrower-1',
          amount: 10000,
          status: 'active',
        },
      ];
      const mockResponse = {
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnValue(mockData),
      } as any;

      jest.spyOn(service, 'findAll').mockResolvedValue({
        data: mockData,
        count: 1,
      });

      await controller.findAll(mockResponse);

      expect(service.findAll).toHaveBeenCalledWith({
        status: undefined,
        excludeRolledBack: false,
      });
      expect(mockResponse.set).toHaveBeenCalledWith('Content-Range', 'loans 0-1/1');
      expect(mockResponse.set).toHaveBeenCalledWith('X-Total-Count', '1');
      expect(mockResponse.json).toHaveBeenCalledWith(mockData);
    });

    it('should pass status filter', async () => {
      const mockResponse = {
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnValue([]),
      } as any;

      jest.spyOn(service, 'findAll').mockResolvedValue({
        data: [],
        count: 0,
      });

      await controller.findAll(mockResponse, 'active');

      expect(service.findAll).toHaveBeenCalledWith({
        status: 'active',
        excludeRolledBack: false,
      });
    });

    it('should pass excludeRolledBack filter', async () => {
      const mockResponse = {
        set: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnValue([]),
      } as any;

      jest.spyOn(service, 'findAll').mockResolvedValue({
        data: [],
        count: 0,
      });

      await controller.findAll(mockResponse, undefined, 'true');

      expect(service.findAll).toHaveBeenCalledWith({
        status: undefined,
        excludeRolledBack: true,
      });
    });
  });

  describe('findOne', () => {
    it('should return a loan', async () => {
      const mockLoan = {
        id: 'loan-1',
        borrowerId: 'borrower-1',
        amount: 10000,
        status: 'active',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);

      const result = await controller.findOne('loan-1');

      expect(result).toEqual(mockLoan);
      expect(service.findOne).toHaveBeenCalledWith('loan-1');
    });

    it('should throw NotFoundException if loan not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAuditTrail', () => {
    it('should return audit trail for a loan', async () => {
      const mockAuditLogs = [
        {
          id: 'audit-1',
          transactionId: 'txn-1',
          operation: 'disbursement_created',
        },
      ];

      jest.spyOn(service, 'getAuditTrail').mockResolvedValue(mockAuditLogs as any);

      const result = await controller.getAuditTrail('loan-1');

      expect(result).toEqual(mockAuditLogs);
      expect(service.getAuditTrail).toHaveBeenCalledWith('loan-1');
    });
  });
});

