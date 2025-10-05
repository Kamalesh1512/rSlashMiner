CREATE TYPE "public"."agent_status" AS ENUM('active', 'paused', 'stopped', 'error');--> statement-breakpoint
CREATE TYPE "public"."notification_frequency" AS ENUM('immediate', 'hourly', 'daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('reddit', 'twitter', 'bluesky', 'linkedin', 'hackernews');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'starter', 'growth', 'enterprise');--> statement-breakpoint
CREATE TABLE "agent_executions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"agent_id" varchar(128) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"execution_type" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"leads_generated" integer DEFAULT 0,
	"posts_analyzed" integer DEFAULT 0,
	"platforms_searched" json DEFAULT '[]'::json,
	"execution_time_ms" integer,
	"average_relevance_score" real,
	"error" text,
	"error_code" varchar(50),
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_keywords" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"agent_id" varchar(128) NOT NULL,
	"keyword" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_platform_configs" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"agent_id" varchar(128) NOT NULL,
	"platform" "platform" NOT NULL,
	"config" json DEFAULT '{}'::json NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"business_description" text NOT NULL,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"is_auto_run" boolean DEFAULT true NOT NULL,
	"platforms" json DEFAULT '[]'::json NOT NULL,
	"notification_frequency" "notification_frequency" DEFAULT 'daily' NOT NULL,
	"notification_channels" json DEFAULT '{"email":true,"slack":false}'::json NOT NULL,
	"last_executed_at" timestamp,
	"next_execution_at" timestamp,
	"execution_count" integer DEFAULT 0 NOT NULL,
	"total_leads_generated" integer DEFAULT 0 NOT NULL,
	"average_relevance_score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitoring_results" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"agent_id" varchar(128) NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"platform" "platform" NOT NULL,
	"platform_post_id" text,
	"platform_comment_id" text,
	"title" text,
	"content" text NOT NULL,
	"url" text NOT NULL,
	"author" text,
	"author_handle" text,
	"author_karma" integer,
	"community" text,
	"parent_post_id" text,
	"score" integer,
	"upvotes" integer,
	"downvotes" integer,
	"num_comments" integer,
	"shares" integer,
	"reactions" integer,
	"relevance_score" integer NOT NULL,
	"sentiment_score" integer DEFAULT 0,
	"confidence_score" real DEFAULT 0,
	"matched_keywords" text,
	"keyword_matches" integer DEFAULT 0,
	"semantic_score" real,
	"topic_categories" json DEFAULT '[]'::json,
	"is_qualified_lead" boolean DEFAULT false,
	"lead_score" integer DEFAULT 0,
	"buying_intent" real DEFAULT 0,
	"is_notified" boolean DEFAULT false,
	"notification_sent_at" timestamp,
	"post_created_at" timestamp,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" json DEFAULT '{}'::json
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"agent_id" varchar(128),
	"type" varchar(20) NOT NULL,
	"channel" varchar(20) NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"metadata" json DEFAULT '{}'::json,
	"lead_ids" json DEFAULT '[]'::json,
	"lead_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"scheduled_for" timestamp,
	"priority" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"password" text,
	"image" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_expires_at" timestamp,
	"dodo_customer_id" text,
	"dodo_subscription_id" text,
	"cancel_at_period_end" boolean DEFAULT false,
	"monthly_lead_limit" integer DEFAULT 50 NOT NULL,
	"monthly_leads_used" integer DEFAULT 0 NOT NULL,
	"last_reset_at" timestamp DEFAULT now(),
	"slack_user_id" text,
	"slack_access_token" text,
	"slack_dm_channel_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_executions" ADD CONSTRAINT "agent_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_keywords" ADD CONSTRAINT "agent_keywords_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_platform_configs" ADD CONSTRAINT "agent_platform_configs_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monitoring_results" ADD CONSTRAINT "monitoring_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_executions_agent_id_idx" ON "agent_executions" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_executions_status_idx" ON "agent_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_executions_started_at_idx" ON "agent_executions" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_keyword_unique" ON "agent_keywords" USING btree ("agent_id","keyword");--> statement-breakpoint
CREATE INDEX "agent_keywords_agent_id_idx" ON "agent_keywords" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_platform_unique" ON "agent_platform_configs" USING btree ("agent_id","platform");--> statement-breakpoint
CREATE INDEX "agents_user_id_idx" ON "agents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agents_next_execution_idx" ON "agents" USING btree ("next_execution_at");--> statement-breakpoint
CREATE INDEX "agents_auto_run_idx" ON "agents" USING btree ("is_auto_run");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_agent_url_monitoring" ON "monitoring_results" USING btree ("agent_id","url");--> statement-breakpoint
CREATE INDEX "monitoring_results_agent_id_idx" ON "monitoring_results" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "monitoring_results_user_id_idx" ON "monitoring_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monitoring_results_platform_idx" ON "monitoring_results" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "monitoring_results_relevance_score_idx" ON "monitoring_results" USING btree ("relevance_score");--> statement-breakpoint
CREATE INDEX "monitoring_results_qualified_lead_idx" ON "monitoring_results" USING btree ("is_qualified_lead");--> statement-breakpoint
CREATE INDEX "monitoring_results_discovered_at_idx" ON "monitoring_results" USING btree ("discovered_at");--> statement-breakpoint
CREATE INDEX "monitoring_results_notification_idx" ON "monitoring_results" USING btree ("is_notified");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "notifications_priority_idx" ON "notifications" USING btree ("priority");