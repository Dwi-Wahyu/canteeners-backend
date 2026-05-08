/*
  Warnings:

  - You are about to drop the column `status` on the `shop_carts` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `shop_carts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "shop_carts" DROP COLUMN "status",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- DropEnum
DROP TYPE "ShopCartStatus";
