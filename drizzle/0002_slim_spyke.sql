CREATE TABLE "email_cooldowns" (
	"email" text PRIMARY KEY NOT NULL,
	"sent_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_registrations" (
	"email" text PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
