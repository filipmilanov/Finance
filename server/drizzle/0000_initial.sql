CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"kind" text DEFAULT 'cash' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"opening_balance" numeric(14, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_user_id_name_key" UNIQUE("user_id","name"),
	CONSTRAINT "accounts_kind_check" CHECK ("kind" IN ('cash', 'bank', 'card', 'savings'))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	CONSTRAINT "categories_user_id_kind_name_key" UNIQUE("user_id","kind","name"),
	CONSTRAINT "categories_kind_check" CHECK ("kind" IN ('expense', 'income'))
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"spent_on" date NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"source_from" text DEFAULT '' NOT NULL,
	"received_on" date NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "incomes_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_user_date_idx" ON "expenses" USING btree ("user_id","spent_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "expenses_account_idx" ON "expenses" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "incomes_user_date_idx" ON "incomes" USING btree ("user_id","received_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "incomes_account_idx" ON "incomes" USING btree ("account_id");
