import { Test, TestingModule } from '@nestjs/testing';
import { RollbacksController } from './rollbacks.controller';

describe('RollbacksController', () => {
  let controller: RollbacksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RollbacksController],
    }).compile();

    controller = module.get<RollbacksController>(RollbacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
