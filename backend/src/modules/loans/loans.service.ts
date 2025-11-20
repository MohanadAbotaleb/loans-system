import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoansService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.loan.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                disbursement: true,
                schedules: { orderBy: { installmentNumber: 'asc' } },
                payments: { orderBy: { paymentDate: 'desc' } },
            }
        });
    }

    async findOne(id: string) {
        const loan = await this.prisma.loan.findUnique({
            where: { id },
            include: {
                disbursement: true,
                schedules: { orderBy: { installmentNumber: 'asc' } },
                payments: { orderBy: { paymentDate: 'desc' } },
            },
        });

        if (!loan) {
            throw new NotFoundException(`Loan with ID ${id} not found`);
        }

        return loan;
    }
}
