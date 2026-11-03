ALTER TABLE "orders" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_access_token_unique" UNIQUE("access_token");