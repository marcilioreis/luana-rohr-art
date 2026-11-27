CREATE TABLE "product_related" (
	"product_id" integer NOT NULL,
	"related_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "product_related_product_id_related_id_pk" PRIMARY KEY("product_id","related_id"),
	CONSTRAINT "product_related_no_self" CHECK ("product_related"."product_id" <> "product_related"."related_id")
);
--> statement-breakpoint
ALTER TABLE "product_related" ADD CONSTRAINT "product_related_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_related" ADD CONSTRAINT "product_related_related_id_products_id_fk" FOREIGN KEY ("related_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_related_related_idx" ON "product_related" USING btree ("related_id");