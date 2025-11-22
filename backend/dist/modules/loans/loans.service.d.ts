import { PrismaService } from '../../prisma/prisma.service';
export declare class LoansService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters?: {
        status?: string;
        excludeRolledBack?: boolean;
    }): Promise<{
        data: ({
            disbursement: {
                loanId: string;
                amount: import("@prisma/client/runtime/library").Decimal;
                id: string;
                disbursementDate: Date;
                status: string;
                rolledBackAt: Date | null;
                createdAt: Date;
            } | null;
        } & {
            borrowerId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            tenor: number;
            interestRate: import("@prisma/client/runtime/library").Decimal;
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        count: number;
    }>;
    findOne(id: string): Promise<({
        disbursement: {
            loanId: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            id: string;
            disbursementDate: Date;
            status: string;
            rolledBackAt: Date | null;
            createdAt: Date;
        } | null;
        payments: {
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
        }[];
    } & {
        borrowerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        tenor: number;
        interestRate: import("@prisma/client/runtime/library").Decimal;
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    getAuditTrail(id: string): Promise<{
        id: string;
        createdAt: Date;
        transactionId: string;
        operation: string;
        userId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
