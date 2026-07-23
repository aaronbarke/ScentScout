ALTER TABLE "retailer_products" ADD COLUMN "gtin" text;--> statement-breakpoint
ALTER TABLE "retailer_products" ADD COLUMN "parsed_fragrance_name" text;--> statement-breakpoint
ALTER TABLE "retailer_products" ADD COLUMN "parsed_concentration" text;--> statement-breakpoint
ALTER TABLE "retailer_products" ADD COLUMN "parsed_size_ml" integer;--> statement-breakpoint
ALTER TABLE "retailer_products" ADD COLUMN "parsed_presentation" "presentation";