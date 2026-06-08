-- DropForeignKey
ALTER TABLE "trip_passenger" DROP CONSTRAINT "trip_passenger_tripId_fkey";

-- DropForeignKey
ALTER TABLE "trip_passenger" DROP CONSTRAINT "trip_passenger_passengerId_fkey";

-- DropForeignKey
ALTER TABLE "trip" DROP CONSTRAINT "trip_driverId_fkey";

-- DropTable
DROP TABLE "trip_passenger";

-- DropTable
DROP TABLE "trip";

-- DropEnum
DROP TYPE "TripPassengerStatus";

-- DropEnum
DROP TYPE "TripStatus";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "vehicleBrand",
DROP COLUMN "vehicleModel",
DROP COLUMN "vehiclePlateNumber";

-- AlterEnum: remove driver from UserRole
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('user', 'admin');
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE
    WHEN "role"::text = 'driver' THEN 'user'::"UserRole_new"
    ELSE "role"::text::"UserRole_new"
  END
);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;
