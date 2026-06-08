BEGIN;
CREATE TYPE "EventType_new" AS ENUM (
  'afterwork',
  'conference',
  'networking',
  'workshop',
  'concert',
  'exhibition',
  'outing',
  'other'
);

ALTER TABLE "event" ALTER COLUMN "type" TYPE "EventType_new" USING (
  CASE "type"::text
    WHEN 'Afterwork' THEN 'afterwork'::"EventType_new"
    WHEN 'Conference' THEN 'conference'::"EventType_new"
    WHEN 'Networking' THEN 'networking'::"EventType_new"
    WHEN 'Workshop' THEN 'workshop'::"EventType_new"
    WHEN 'Concert' THEN 'concert'::"EventType_new"
    WHEN 'Exposition' THEN 'exhibition'::"EventType_new"
    WHEN 'Sortie' THEN 'outing'::"EventType_new"
    WHEN 'Autre' THEN 'other'::"EventType_new"
    ELSE "type"::text::"EventType_new"
  END
);

ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;
