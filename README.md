# Loan Disbursement & Repayment System

A production-ready loan management system with disbursement, repayment processing, rollback capabilities, and comprehensive audit logging.

## Prerequisites

- **Node.js**: v20 or higher
- **Docker**: v20.10 or higher
- **Docker Compose**: v2.0 or higher

## Setup

### Option 1: Docker (Recommended)

```bash
docker-compose up
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3000
- Frontend on port 5173

### Option 2: Manual Setup

```bash
# Install dependencies
cd backend && npm install

# Set up database
npx prisma migrate dev
npx prisma generate

# Start the application
npm run start:dev
```

**Note**: For manual setup, ensure PostgreSQL is running and configure `DATABASE_URL` in your environment. The seed script is not available.

## Running Tests

```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## API Documentation

The API is available at `http://localhost:3000` when running.

### Main Endpoints

- `POST /disbursements` - Create loan disbursement
- `GET /disbursements` - List all disbursements
- `POST /disbursements/:id/rollback` - Rollback a disbursement
- `POST /repayments` - Record a repayment
- `GET /repayments/:loanId` - Get payment history
- `GET /repayments/:loanId/schedule` - Get repayment schedule
- `GET /repayments/:loanId/calculate` - Calculate amount due
- `GET /loans/:id` - Get loan details
- `GET /loans/:id/audit-trail` - Get audit trail
- `GET /health` - Health check

## Known Issues & Limitations

- No authentication/authorization implemented (all endpoints are public)
- No seed data script available
- CORS is configured to allow all origins (`*`)
- No rate limiting implemented

