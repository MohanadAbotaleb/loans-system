import { RepaymentsService } from './repayments.service';
import { CreateRepaymentDto } from './dto/create-repayment.dto';
export declare class RepaymentsController {
    private readonly repaymentsService;
    constructor(repaymentsService: RepaymentsService);
    create(createRepaymentDto: CreateRepaymentDto): Promise<{
        loanId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        id: string;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
        paymentDate: Date;
        principalPaid: import("@prisma/client-runtime-utils").Decimal;
        interestPaid: import("@prisma/client-runtime-utils").Decimal;
        lateFeePaid: import("@prisma/client-runtime-utils").Decimal;
        daysLate: number;
    }>;
}
