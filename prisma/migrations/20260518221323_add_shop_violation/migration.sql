-- CreateEnum
CREATE TYPE "ShopViolationType" AS ENUM ('HIGH_DAILY_CANCEL_RATE', 'SLOW_ORDER_CONFIRMATION', 'HIGH_ORDER_LATE_RATE', 'REFUND_IGNORED', 'REFUND_SLOW_RESPONSE', 'POLICY_VIOLATION', 'REFUND_FRAUD_SUSPECTED', 'REPEATED_CRITICAL_VIOLATIONS');

-- CreateEnum
CREATE TYPE "ShopViolationSource" AS ENUM ('ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "shop_violations" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "type" "ShopViolationType" NOT NULL,
    "source" "ShopViolationSource" NOT NULL,
    "order_id" TEXT,
    "refund_id" TEXT,
    "note" TEXT,
    "reviewed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "shop_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_violations_shop_id_idx" ON "shop_violations"("shop_id");

-- CreateIndex
CREATE INDEX "shop_violations_type_idx" ON "shop_violations"("type");

-- CreateIndex
CREATE INDEX "shop_violations_created_at_idx" ON "shop_violations"("created_at");

-- AddForeignKey
ALTER TABLE "shop_violations" ADD CONSTRAINT "shop_violations_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_violations" ADD CONSTRAINT "shop_violations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_violations" ADD CONSTRAINT "shop_violations_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
