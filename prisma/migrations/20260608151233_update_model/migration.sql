/*
  Warnings:

  - You are about to drop the column `quartier` on the `user` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventStatus" ADD VALUE 'draft';
ALTER TYPE "EventStatus" ADD VALUE 'archived';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "quartier";
