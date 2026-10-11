CREATE TYPE "public"."marital_status" AS ENUM('SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('MEMBER', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('PENDING', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"actor_id" text,
	"actor_name" text NOT NULL,
	"target_id" text,
	"target_name" text,
	"action" text NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"old_value" jsonb,
	"new_value" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "districts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"pending_email" text,
	"phone" text,
	"password_hash" text,
	"date_of_birth" date,
	"gender" text,
	"marital_status" "marital_status",
	"address_line" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'Nigeria' NOT NULL,
	"photo_url" text,
	"role" "role" DEFAULT 'MEMBER' NOT NULL,
	"status" "status" DEFAULT 'PENDING' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"consent_given_at" timestamp with time zone,
	"deletion_requested_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"tokens_valid_after" timestamp with time zone,
	"department_id" text,
	"district_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_id_users_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "audit_target_idx" ON "audit_logs" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_name_idx" ON "users" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "users_department_idx" ON "users" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "users_district_idx" ON "users" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");