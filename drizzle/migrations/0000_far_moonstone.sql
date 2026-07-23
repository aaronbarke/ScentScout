CREATE TYPE "public"."alert_delivery_status" AS ENUM('pending', 'sent', 'failed', 'suppressed');--> statement-breakpoint
CREATE TYPE "public"."concentration" AS ENUM('eau_de_parfum', 'eau_de_toilette', 'parfum', 'extrait_de_parfum', 'eau_de_cologne', 'eau_fraiche', 'elixir');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('new');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percentage', 'fixed_amount');--> statement-breakpoint
CREATE TYPE "public"."coupon_verification_status" AS ENUM('verified', 'reported', 'expired', 'invalid', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."gender_marketing" AS ENUM('masculine', 'feminine', 'unisex');--> statement-breakpoint
CREATE TYPE "public"."match_method" AS ENUM('deterministic', 'manual', 'llm_assisted');--> statement-breakpoint
CREATE TYPE "public"."match_review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('exact', 'probable', 'manual_review', 'rejected', 'unmatched');--> statement-breakpoint
CREATE TYPE "public"."presentation" AS ENUM('retail', 'tester', 'refill', 'unboxed', 'gift_set');--> statement-breakpoint
CREATE TYPE "public"."retailer_type" AS ENUM('official_brand', 'department_store', 'authorized_boutique', 'gray_market_discounter', 'marketplace', 'decant_store');--> statement-breakpoint
CREATE TYPE "public"."scrape_run_status" AS ENUM('running', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"normalized_name" text NOT NULL,
	"official_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fragrances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"flanker_name" text,
	"release_year" integer,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fragrances_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fragrance_id" uuid NOT NULL,
	"concentration" "concentration" NOT NULL,
	"size_ml" integer NOT NULL,
	"presentation" "presentation" NOT NULL,
	"condition" "condition" DEFAULT 'new' NOT NULL,
	"gender_marketing" "gender_marketing",
	"canonical_sku" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_canonical_sku_unique" UNIQUE("canonical_sku")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"minimum_order_cents" integer,
	"maximum_discount_cents" integer,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"verification_status" "coupon_verification_status" DEFAULT 'unknown' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_retailer_code_uq" UNIQUE("retailer_id","code")
);
--> statement-breakpoint
CREATE TABLE "retailer_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_id" uuid NOT NULL,
	"external_id" text,
	"url" text NOT NULL,
	"raw_title" text NOT NULL,
	"raw_brand" text,
	"raw_description" text,
	"matched_variant_id" uuid,
	"match_status" "match_status" DEFAULT 'unmatched' NOT NULL,
	"match_confidence" real,
	"match_method" "match_method",
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retailer_products_retailer_external_uq" UNIQUE("retailer_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "retailers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"base_url" text NOT NULL,
	"retailer_type" "retailer_type" NOT NULL,
	"affiliate_program" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"trust_score" integer DEFAULT 50 NOT NULL,
	"default_shipping_policy" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retailers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "match_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_product_id" uuid NOT NULL,
	"suggested_variant_id" uuid,
	"original_confidence" real,
	"review_status" "match_review_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "retailer_health" (
	"retailer_id" uuid PRIMARY KEY NOT NULL,
	"last_success_at" timestamp with time zone,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"success_rate_24h" real,
	"parser_version" text,
	"disabled_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "scrape_run_status" DEFAULT 'running' NOT NULL,
	"pages_attempted" integer DEFAULT 0 NOT NULL,
	"pages_succeeded" integer DEFAULT 0 NOT NULL,
	"products_found" integer DEFAULT 0 NOT NULL,
	"observations_created" integer DEFAULT 0 NOT NULL,
	"error_summary" text
);
--> statement-breakpoint
CREATE TABLE "price_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailer_product_id" uuid NOT NULL,
	"listed_price_cents" integer,
	"coupon_discount_cents" integer DEFAULT 0 NOT NULL,
	"shipping_price_cents" integer,
	"estimated_delivered_price_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"in_stock" boolean,
	"stock_text" text,
	"shipping_days_min" integer,
	"shipping_days_max" integer,
	"shipping_text" text,
	"coupon_id" uuid,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_run_id" uuid
);
--> statement-breakpoint
CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid NOT NULL,
	"price_observation_id" uuid NOT NULL,
	"delivery_status" "alert_delivery_status" DEFAULT 'pending' NOT NULL,
	"deduplication_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	CONSTRAINT "alert_events_deduplication_key_unique" UNIQUE("deduplication_key")
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"maximum_delivered_price_cents" integer,
	"retailer_ids" uuid[],
	"presentation" "presentation",
	"maximum_shipping_days" integer,
	"require_verified_coupon" boolean DEFAULT false NOT NULL,
	"require_exact_match" boolean DEFAULT true NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_variant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "watchlists_user_variant_uq" UNIQUE("user_id","product_variant_id")
);
--> statement-breakpoint
ALTER TABLE "fragrances" ADD CONSTRAINT "fragrances_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_fragrance_id_fragrances_id_fk" FOREIGN KEY ("fragrance_id") REFERENCES "public"."fragrances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_products" ADD CONSTRAINT "retailer_products_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_products" ADD CONSTRAINT "retailer_products_matched_variant_id_product_variants_id_fk" FOREIGN KEY ("matched_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_reviews" ADD CONSTRAINT "match_reviews_retailer_product_id_retailer_products_id_fk" FOREIGN KEY ("retailer_product_id") REFERENCES "public"."retailer_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_reviews" ADD CONSTRAINT "match_reviews_suggested_variant_id_product_variants_id_fk" FOREIGN KEY ("suggested_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retailer_health" ADD CONSTRAINT "retailer_health_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_runs" ADD CONSTRAINT "scrape_runs_retailer_id_retailers_id_fk" FOREIGN KEY ("retailer_id") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_retailer_product_id_retailer_products_id_fk" FOREIGN KEY ("retailer_product_id") REFERENCES "public"."retailer_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_observations" ADD CONSTRAINT "price_observations_source_run_id_scrape_runs_id_fk" FOREIGN KEY ("source_run_id") REFERENCES "public"."scrape_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_price_observation_id_price_observations_id_fk" FOREIGN KEY ("price_observation_id") REFERENCES "public"."price_observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_product_variant_id_product_variants_id_fk" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fragrances_brand_id_idx" ON "fragrances" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "product_variants_fragrance_id_idx" ON "product_variants" USING btree ("fragrance_id");--> statement-breakpoint
CREATE INDEX "coupons_retailer_id_idx" ON "coupons" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "retailer_products_retailer_id_idx" ON "retailer_products" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "retailer_products_matched_variant_id_idx" ON "retailer_products" USING btree ("matched_variant_id");--> statement-breakpoint
CREATE INDEX "retailer_products_match_status_idx" ON "retailer_products" USING btree ("match_status");--> statement-breakpoint
CREATE INDEX "match_reviews_retailer_product_id_idx" ON "match_reviews" USING btree ("retailer_product_id");--> statement-breakpoint
CREATE INDEX "match_reviews_review_status_idx" ON "match_reviews" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "scrape_runs_retailer_id_idx" ON "scrape_runs" USING btree ("retailer_id");--> statement-breakpoint
CREATE INDEX "price_observations_retailer_product_id_idx" ON "price_observations" USING btree ("retailer_product_id");--> statement-breakpoint
CREATE INDEX "price_observations_observed_at_idx" ON "price_observations" USING btree ("observed_at");--> statement-breakpoint
CREATE INDEX "alert_events_alert_rule_id_idx" ON "alert_events" USING btree ("alert_rule_id");--> statement-breakpoint
CREATE INDEX "alert_rules_user_id_idx" ON "alert_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "alert_rules_product_variant_id_idx" ON "alert_rules" USING btree ("product_variant_id");--> statement-breakpoint
CREATE INDEX "watchlists_user_id_idx" ON "watchlists" USING btree ("user_id");