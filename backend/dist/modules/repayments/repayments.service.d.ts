import { PrismaService } from '../../prisma/prisma.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { Prisma } from '@prisma/client';
export declare class RepaymentsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        data: {
            loanId: string;
            amount: Prisma.Decimal;
            id: string;
            status: string;
            rolledBackAt: Date | null;
            createdAt: Date;
            paymentDate: Date;
            principalPaid: Prisma.Decimal;
            interestPaid: Prisma.Decimal;
            lateFeePaid: Prisma.Decimal;
            daysLate: number;
        }[];
        count: number;
    }>;
    recordRepayment(data: CreateRepaymentDto): Promise<{
        loanId: string;
        amount: Prisma.Decimal;
        id: string;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
        paymentDate: Date;
        principalPaid: Prisma.Decimal;
        interestPaid: Prisma.Decimal;
        lateFeePaid: Prisma.Decimal;
        daysLate: number;
    }>;
    getHistory(loanId: string): Promise<{
        loanId: string;
        amount: Prisma.Decimal;
        id: string;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
        paymentDate: Date;
        principalPaid: Prisma.Decimal;
        interestPaid: Prisma.Decimal;
        lateFeePaid: Prisma.Decimal;
        daysLate: number;
    }[]>;
    getSchedule(loanId: string): Promise<{
        loanId: string;
        id: string;
        status: string;
        createdAt: Date;
        installmentNumber: number;
        dueDate: Date;
        principalAmount: Prisma.Decimal;
        interestAmount: Prisma.Decimal;
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
}
