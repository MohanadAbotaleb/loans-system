import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
export declare class DisbursementsController {
    private readonly disbursementsService;
    constructor(disbursementsService: DisbursementsService);
    create(createDisbursementDto: CreateDisbursementDto): Promise<{
        loanId: string;
        amount: import("@prisma/client-runtime-utils").Decimal;
        id: string;
        disbursementDate: Date;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
    }>;
}
