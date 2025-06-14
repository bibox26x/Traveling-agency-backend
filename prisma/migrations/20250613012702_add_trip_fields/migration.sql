-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "currentParticipants" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficultyLevel" TEXT NOT NULL DEFAULT 'moderate',
ALTER COLUMN "capacity" SET DEFAULT 10;
