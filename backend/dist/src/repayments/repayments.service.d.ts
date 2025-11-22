import { PrismaService } from '../prisma/prisma.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
import { Prisma } from '@prisma/client';
export declare class RepaymentsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
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
}
