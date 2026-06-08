-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('Afterwork', 'Conference', 'Networking', 'Workshop', 'Concert', 'Exposition', 'Sortie', 'Autre');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('published', 'cancelled', 'completed');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "company" TEXT,
ADD COLUMN     "directoryVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "quartier" TEXT,
ADD COLUMN     "showEmailInDirectory" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showPhoneInDirectory" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "links" JSONB NOT NULL DEFAULT '[]',
    "status" "EventStatus" NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_status_startsAt_idx" ON "event"("status", "startsAt");

-- CreateIndex
CREATE INDEX "event_type_startsAt_idx" ON "event"("type", "startsAt");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
