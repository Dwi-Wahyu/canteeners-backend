/*
  Warnings:

  - You are about to drop the column `notes` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `shop_carts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "notes",
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "shop_carts" DROP COLUMN "notes",
ADD COLUMN     "note" TEXT;
