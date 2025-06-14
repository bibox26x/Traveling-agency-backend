-- Create admin user if not exists
INSERT INTO "User" (email, password, name, role, "createdAt")
SELECT 'admin@example.com', 'admin123', 'Admin', 'admin', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE role = 'admin');

-- Set default values for existing rows
UPDATE "Trip" SET
  "image_url" = 'default-trip-image.jpg',
  "capacity" = 10,
  "updatedAt" = NOW(),
  "createdById" = (SELECT id FROM "User" WHERE role = 'admin' LIMIT 1)
WHERE "image_url" IS NULL OR "createdById" IS NULL;

-- Add new columns with defaults
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "image_url" TEXT NOT NULL DEFAULT 'default-trip-image.jpg';
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Set NOT NULL constraint after data is updated
ALTER TABLE "Trip" ALTER COLUMN "createdById" SET NOT NULL;

-- Remove defaults after columns are added
ALTER TABLE "Trip" ALTER COLUMN "image_url" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "capacity" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Rename columns to use camelCase
ALTER TABLE "Trip" RENAME COLUMN "image_url" TO "imageUrl";
ALTER TABLE "Trip" RENAME COLUMN "start_date" TO "startDate";
ALTER TABLE "Trip" RENAME COLUMN "end_date" TO "endDate";

ALTER TABLE "Booking" RENAME COLUMN "total_price" TO "totalPrice";
ALTER TABLE "Booking" RENAME COLUMN "booking_date" TO "bookingDate"; 