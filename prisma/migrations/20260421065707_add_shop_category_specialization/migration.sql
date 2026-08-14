-- CreateTable
CREATE TABLE "shop_categories" (
    "shop_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "shop_categories_pkey" PRIMARY KEY ("shop_id","category_id")
);

-- CreateIndex
CREATE INDEX "shop_categories_category_id_idx" ON "shop_categories"("category_id");

-- CreateIndex
CREATE INDEX "shop_categories_shop_id_idx" ON "shop_categories"("shop_id");

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_categories" ADD CONSTRAINT "shop_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
