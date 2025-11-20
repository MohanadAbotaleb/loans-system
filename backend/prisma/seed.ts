import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Create or update platform funds
    const platformFundsUSD = await prisma.platformFunds.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            availableBalance: 1000000, // Start with $1M
            currency: 'USD',
        },
    });

    console.log('✓ Created platform funds (USD):', platformFundsUSD);

    // Optional: Create sample loan for testing
    const sampleLoan = await prisma.loan.upsert({
        where: { id: 'loan-sample-001' },
        update: {},
        create: {
            id: 'loan-sample-001',
            borrowerId: 'borrower-001',
            amount: 10000,
            interestRate: 12,
            tenor: 12,
            status: 'approved',
        },
    });

    console.log('✓ Created sample loan:', sampleLoan);

    console.log('✅ Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
