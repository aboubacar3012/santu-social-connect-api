-- Plage de dates événement : fin optionnelle + journée entière
ALTER TABLE "event" ADD COLUMN "endsAt" TIMESTAMP(3);
ALTER TABLE "event" ADD COLUMN "isAllDay" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "event_status_endsAt_idx" ON "event"("status", "endsAt");
