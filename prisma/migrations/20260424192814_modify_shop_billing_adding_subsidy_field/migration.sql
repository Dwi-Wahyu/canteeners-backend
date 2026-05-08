/*
  Warnings:

  - You are about to drop the column `refund` on the `shop_billings` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `shop_billings` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `shop_billings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "shop_billings" DROP COLUMN "refund",
DROP COLUMN "subtotal",
DROP COLUMN "total",
ADD COLUMN     "commission_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "net_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refund_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "subsidy_total" DOUBLE PRECISION NOT NULL DEFAULT 0;
