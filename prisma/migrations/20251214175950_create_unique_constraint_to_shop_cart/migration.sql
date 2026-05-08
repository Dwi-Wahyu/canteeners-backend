/*
  Warnings:

  - A unique constraint covering the columns `[cart_id,shop_id]` on the table `shop_carts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "shop_carts_cart_id_shop_id_key" ON "shop_carts"("cart_id", "shop_id");
