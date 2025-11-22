// Load test environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/loan_system_test';

// Set test timeout for E2E tests
jest.setTimeout(30000);
