-- CreateTable
CREATE TABLE "platform_funds" (
    "id" TEXT NOT NULL,
    "available_balance" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_funds_pkey" PRIMARY KEY ("id")
);
