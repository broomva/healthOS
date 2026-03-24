ALTER TABLE "User" ALTER COLUMN "password" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "Chat" DROP COLUMN IF EXISTS "lastContext";