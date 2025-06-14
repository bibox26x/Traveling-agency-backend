-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_destinationId_fkey";

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "destinationId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;
