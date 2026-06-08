BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('freemium', 'premium', 'enterprise', 'admin');

ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "UserRole_new" USING (
  CASE "role"::text
    WHEN 'admin' THEN 'admin'::"UserRole_new"
    WHEN 'user' THEN 'freemium'::"UserRole_new"
    WHEN 'driver' THEN 'freemium'::"UserRole_new"
    ELSE 'freemium'::"UserRole_new"
  END
);

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'freemium';
COMMIT;
