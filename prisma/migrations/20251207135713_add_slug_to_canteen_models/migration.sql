/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `canteens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "canteens" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "canteens_slug_key" ON "canteens"("slug");
