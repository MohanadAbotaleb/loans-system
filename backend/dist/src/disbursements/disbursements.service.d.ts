import { PrismaService } from '../prisma/prisma.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { Prisma } from '@prisma/client';
export declare class DisbursementsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    disburseLoan(data: CreateDisbursementDto): Promise<{
        loanId: string;
        amount: Prisma.Decimal;
        id: string;
        disbursementDate: Date;
        status: string;
        rolledBackAt: Date | null;
        createdAt: Date;
    }>;
    private generateSchedule;
}
