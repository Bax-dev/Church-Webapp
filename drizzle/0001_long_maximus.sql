CREATE TABLE "prayer_guides" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"date" date NOT NULL,
	"theme" text NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"body" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prayer_guides_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE INDEX "prayer_guides_published_date_idx" ON "prayer_guides" USING btree ("published","date");