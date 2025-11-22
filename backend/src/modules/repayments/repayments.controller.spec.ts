import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentsController } from './repayments.controller';
import { RepaymentsService } from './repayments.service';

describe('RepaymentsController', () => {
  let controller: RepaymentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepaymentsController],
      providers: [
        {
          provide: RepaymentsService,
          useValue: {
            recordRepayment: jest.fn(),
            findAll: jest.fn(),
            getHistory: jest.fn(),
            getSchedule: jest.fn(),
            calculateDue: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RepaymentsController>(RepaymentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
