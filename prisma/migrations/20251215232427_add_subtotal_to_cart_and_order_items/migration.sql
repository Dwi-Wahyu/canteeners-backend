/*
  Warnings:

  - You are about to drop the column `product_option_id` on the `cart_items` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `order_items` table. All the data in the column will be lost.
  - Added the required column `subtotal` to the `cart_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price_at_add` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "product_option_id",
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "price",
ADD COLUMN     "price_at_add" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL;
