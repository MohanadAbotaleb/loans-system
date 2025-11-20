import { Injectable, BadRequestException } from '@nestjs/common';

export interface PaymentAllocation {
    principalPaid: number;
    interestPaid: number;
    lateFeePaid: number;
}

@Injectable()
export class RepaymentCalculationService {
    calculateDailyInterest(
        principal: number,
        annualRate: number,
        days: number,
        isLeapYear: boolean = false,
    ): number {
        if (principal < 0) throw new BadRequestException('Principal amount cannot be negative');
        if (days < 0) throw new BadRequestException('Days cannot be negative');
        if (days === 0) return 0;

        const daysInYear = isLeapYear ? 366 : 365;
        const dailyRate = annualRate / 100 / daysInYear;
        return principal * dailyRate * days;
    }

    calculateLateFee(daysLate: number): number {
        if (daysLate <= 3) return 0; // Grace period
        if (daysLate < 30) return 25; // Flat fee
        return 50; // Increased fee
    }

    allocatePayment(
        paymentAmount: number,
        accruedInterest: number,
        lateFee: number,
        outstandingPrincipal: number,
    ): PaymentAllocation {
        let remainingPayment = paymentAmount;

        // 1. Pay Interest
        const interestPaid = Math.min(remainingPayment, accruedInterest);
        remainingPayment -= interestPaid;

        // 2. Pay Late Fee
        const lateFeePaid = Math.min(remainingPayment, lateFee);
        remainingPayment -= lateFeePaid;

        // 3. Pay Principal
        const principalPaid = Math.min(remainingPayment, outstandingPrincipal);

        return {
            interestPaid,
            lateFeePaid,
            principalPaid,
        };
    }
}
