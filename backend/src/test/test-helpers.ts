import { PrismaClient } from '@prisma/client';

export const mockPrismaService = {
    $transaction: jest.fn(),
    loan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    disbursement: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    payment: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
    },
    repaymentSchedule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
    },
    auditLog: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
    rollbackRecord: {
        findMany: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
    },
};

export const createTestDisbursement = () => ({
    loanId: '550e8400-e29b-41d4-a716-446655440000',
    borrowerId: '550e8400-e29b-41d4-a716-446655440001',
    amount: 10000,
    currency: 'USD',
    tenor: 12,
    interestRate: 12,
});

export const createTestRepayment = () => ({
    loanId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 1000,
});

export const createTestLoan = () => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    borrowerId: '550e8400-e29b-41d4-a716-446655440001',
    amount: 10000,
    interestRate: 12,
    tenor: 12,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
});

export const clearMocks = () => {
    Object.values(mockPrismaService).forEach((model) => {
        if (typeof model === 'object') {
            Object.values(model).forEach((method) => {
                if (jest.isMockFunction(method)) {
                    method.mockClear();
                }
            });
        }
    });
};
