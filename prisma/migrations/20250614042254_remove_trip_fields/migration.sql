/*
  Warnings:

  - You are about to drop the column `capacity` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `currentParticipants` on the `Trip` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyLevel` on the `Trip` table. All the data in the column will be lost.

*/
-- First add duration with a default value
ALTER TABLE "Trip" ADD COLUMN "duration" INTEGER NOT NULL DEFAULT 1;

-- Then drop the other columns
ALTER TABLE "Trip" 
DROP COLUMN "capacity",
DROP COLUMN "currentParticipants",
DROP COLUMN "difficultyLevel";

-- Finally remove the default constraint from duration
ALTER TABLE "Trip" ALTER COLUMN "duration" DROP DEFAULT;
