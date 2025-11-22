import { Test, TestingModule } from '@nestjs/testing';
import { DisbursementsController } from './disbursements.controller';

describe('DisbursementsController', () => {
  let controller: DisbursementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisbursementsController],
    }).compile();

    controller = module.get<DisbursementsController>(DisbursementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
