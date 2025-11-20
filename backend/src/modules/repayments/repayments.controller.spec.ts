import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsService } from './repayments.service';

describe('RepaymentsController', () => {
  let controller: RepaymentsController;

  const mockService = {
    processRepayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepaymentsController],
      providers: [
        { provide: RepaymentsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<RepaymentsController>(RepaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
