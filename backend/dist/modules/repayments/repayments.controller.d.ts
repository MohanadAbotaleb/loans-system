import { RepaymentsService } from './repayments.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import type { Response } from 'express';
export declare class RepaymentsController {
    private readonly repaymentsService;
    constructor(repaymentsService: RepaymentsService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    getHistory(loanId: string): Promise<{
        loanId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
        paymentDate: Date;
        principalPaid: import("@prisma/client/runtime/library").Decimal;
        interestPaid: import("@prisma/client/runtime/library").Decimal;
        lateFeePaid: import("@prisma/client/runtime/library").Decimal;
        daysLate: number;
    }[]>;
    getSchedule(loanId: string): Promise<{
        loanId: string;
        id: string;
        status: string;
        createdAt: Date;
        installmentNumber: number;
        dueDate: Date;
        principalAmount: import("@prisma/client/runtime/library").Decimal;
        interestAmount: import("@prisma/client/runtime/library").Decimal;
        paidDate: Date | null;
    }[]>;
    calculateDue(loanId: string): Promise<{
        loanId: string;
        totalDue: number;
        breakdown: {
            overdueInstallments: number;
            principal: number;
            interest: number;
        };
    }>;
    create(createRepaymentDto: CreateRepaymentDto): Promise<{
        loanId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        id: string;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
        paymentDate: Date;
        principalPaid: import("@prisma/client/runtime/library").Decimal;
        interestPaid: import("@prisma/client/runtime/library").Decimal;
        lateFeePaid: import("@prisma/client/runtime/library").Decimal;
        daysLate: number;
    }>;
}
