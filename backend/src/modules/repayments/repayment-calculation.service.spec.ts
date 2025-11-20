import { Test, TestingModule } from '@nestjs/testing';
import { RepaymentCalculationService } from './repayment-calculation.service';
import { BadRequestException } from '@nestjs/common';

describe('RepaymentCalculationService', () => {
    let service: RepaymentCalculationService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RepaymentCalculationService],
        }).compile();

        service = module.get<RepaymentCalculationService>(RepaymentCalculationService);
    });

    describe('calculateDailyInterest', () => {
        it('should calculate interest correctly for 30 days', () => {
            const principal = 10000;
            const annualRate = 12;
            const days = 30;

            const interest = service.calculateDailyInterest(principal, annualRate, days);
            // 10000 * (0.12/365) * 30 = 98.63
            expect(interest).toBeCloseTo(98.63, 2);
        });

        it('should calculate interest correctly for 35 days', () => {
            const principal = 10000;
            const annualRate = 12;
            const days = 35;

            const interest = service.calculateDailyInterest(principal, annualRate, days);
            expect(interest).toBeCloseTo(115.07, 2);
        });

        it('should handle leap year correctly', () => {
            const principal = 10000;
            const annualRate = 12;
            const days = 366;

            const interest = service.calculateDailyInterest(principal, annualRate, days, true);
            expect(interest).toBeCloseTo(1200, 2);
        });

        it('should throw error for negative principal', () => {
            expect(() => service.calculateDailyInterest(-1000, 12, 30)).toThrow(BadRequestException);
        });
    });

    describe('calculateLateFee', () => {
        it('should return 0 for payments on time', () => {
            expect(service.calculateLateFee(0)).toBe(0);
        });

        it('should return 0 for grace period (3 days)', () => {
            expect(service.calculateLateFee(3)).toBe(0);
        });

        it('should return 25 for 4-29 days late', () => {
            expect(service.calculateLateFee(4)).toBe(25);
            expect(service.calculateLateFee(29)).toBe(25);
        });

        it('should return 50 for 30+ days late', () => {
            expect(service.calculateLateFee(30)).toBe(50);
        });
    });

    describe('allocatePayment', () => {
        it('should allocate interest -> late fee -> principal', () => {
            const allocation = service.allocatePayment(1000, 100, 25, 5000);
            expect(allocation.interestPaid).toBe(100);
            expect(allocation.lateFeePaid).toBe(25);
            expect(allocation.principalPaid).toBe(875);
        });

        it('should handle partial payment covering only interest', () => {
            const allocation = service.allocatePayment(50, 100, 25, 5000);
            expect(allocation.interestPaid).toBe(50);
            expect(allocation.lateFeePaid).toBe(0);
            expect(allocation.principalPaid).toBe(0);
        });
    });
});
