import { Test, TestingModule } from '@nestjs/testing';
import { RollbacksController } from './rollbacks.controller';
import { RollbacksService } from './rollbacks.service';

describe('RollbacksController', () => {
  let controller: RollbacksController;

  const mockService = {
    rollbackTransaction: jest.fn(),
    getAuditTrail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RollbacksController],
      providers: [
        { provide: RollbacksService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<RollbacksController>(RollbacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
