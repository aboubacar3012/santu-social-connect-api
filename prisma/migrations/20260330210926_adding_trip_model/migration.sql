-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('published', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "TripPassengerStatus" AS ENUM ('requested', 'confirmed', 'rejected', 'cancelled');

-- CreateTable
CREATE TABLE "trip" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "departureCity" TEXT NOT NULL,
    "departureAddress" TEXT,
    "arrivalCity" TEXT NOT NULL,
    "arrivalAddress" TEXT,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "pricePerSeat" DECIMAL(10,2),
    "description" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_passenger" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "seatsBooked" INTEGER NOT NULL DEFAULT 1,
    "status" "TripPassengerStatus" NOT NULL DEFAULT 'requested',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_passenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_driverId_departureAt_idx" ON "trip"("driverId", "departureAt");

-- CreateIndex
CREATE INDEX "trip_status_departureAt_idx" ON "trip"("status", "departureAt");

-- CreateIndex
CREATE INDEX "trip_passenger_passengerId_status_idx" ON "trip_passenger"("passengerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "trip_passenger_tripId_passengerId_key" ON "trip_passenger"("tripId", "passengerId");

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_passenger" ADD CONSTRAINT "trip_passenger_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_passenger" ADD CONSTRAINT "trip_passenger_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
