/*
  Warnings:

  - The values [approved,rejected] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `tags` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleTags` on the `user` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IdentityVerificationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('pending', 'active', 'inactive', 'deleted', 'suspended');
ALTER TABLE "public"."user" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'pending';
COMMIT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "tags",
DROP COLUMN "vehicleTags",
ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "identityVerificationStatus" "IdentityVerificationStatus" DEFAULT 'pending';
