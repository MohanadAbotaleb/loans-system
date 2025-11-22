import { Test, TestingModule } from '@nestjs/testing';
import { RollbacksController } from './rollbacks.controller';
import { RollbacksService } from './rollbacks.service';

describe('RollbacksController', () => {
  let controller: RollbacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RollbacksController],
      providers: [
        {
          provide: RollbacksService,
          useValue: {
            rollbackTransaction: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RollbacksController>(RollbacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
