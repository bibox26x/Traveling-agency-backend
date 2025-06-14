/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `Trip` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Trip_title_key" ON "Trip"("title");
