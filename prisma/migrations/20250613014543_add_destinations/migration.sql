/*
  Warnings:

  - Added the required column `destinationId` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Destination" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- Create default destination for existing trips
INSERT INTO "Destination" ("name", "description", "imageUrl", "country", "updatedAt")
VALUES ('Default Location', 'Default destination for existing trips', 'https://picsum.photos/800/600', 'Unknown', CURRENT_TIMESTAMP);

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN "destinationId" INTEGER;

-- Update existing trips to use default destination
UPDATE "Trip" SET "destinationId" = (SELECT id FROM "Destination" WHERE name = 'Default Location');

-- Make destinationId required
ALTER TABLE "Trip" ALTER COLUMN "destinationId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_key" ON "Destination"("name");

-- CreateIndex
CREATE INDEX "Trip_destinationId_idx" ON "Trip"("destinationId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
