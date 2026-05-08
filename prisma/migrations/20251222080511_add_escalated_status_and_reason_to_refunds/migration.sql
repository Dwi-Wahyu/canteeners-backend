-- AlterEnum
ALTER TYPE "RefundStatus" ADD VALUE 'ESCALATED';

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "escalated_reason" TEXT;
