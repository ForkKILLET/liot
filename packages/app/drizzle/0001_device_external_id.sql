ALTER TABLE "devices" ADD COLUMN "device_id" text;
--> statement-breakpoint
UPDATE "devices" SET "device_id" = "id"::text WHERE "device_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "devices" ALTER COLUMN "device_id" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "devices_template_id_device_id_unique" ON "devices" USING btree ("template_id", "device_id");
