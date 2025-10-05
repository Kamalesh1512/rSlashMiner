import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  serial,
  text,
  timestamp,
  json,
  boolean,
  integer,
  real,
  primaryKey,
  unique,
  uniqueIndex,
  index,
  pgEnum,
  vector,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Enums for better type safety
export const platformEnum = pgEnum("platform", [
  "reddit",
  "x",
  "bluesky",
  "linkedin",
  "hackernews",
]);
export const agentStatusEnum = pgEnum("agent_status", [
  "active",
  "paused",
  "stopped",
  "error",
]);
export const notificationFrequencyEnum = pgEnum("notification_frequency", [
  "immediate",
  "hourly",
  "daily",
  "weekly",
]);
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "starter",
  "growth",
  "enterprise",
]);

// Users table - Enhanced with lead limits
export const users = pgTable("users", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: "date" }),
  dodoCustomerId: text("dodo_customer_id"),
  dodoSubscriptionId: text("dodo_subscription_id"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  paidUserIndex: integer("paid_user_index"),

  // Plan limits (monthly)
  monthlyLeadLimit: integer("monthly_lead_limit").default(50).notNull(),
  monthlyLeadsUsed: integer("monthly_leads_used").default(0).notNull(),
  maxAgents: integer("max_agents").default(1).notNull(),
  lastResetAt: timestamp("last_reset_at", { mode: "date" }).defaultNow(),

  // Slack/notification settings
  slackUserId: text("slack_user_id"),
  slackAccessToken: text("slack_access_token"),
  slackDmChannelId: text("slack_dm_channel_id"),

  // slackConnected: boolean("slack_connected").default(false).notNull(),

  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// Enhanced agents table with automatic execution
export const agents = pgTable(
  "agents",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Basic info
    name: text("name").notNull(),
    description: text("description"),
    // Status and control
    status: agentStatusEnum("status").default("active").notNull(),
    isAutoRun: boolean("is_auto_run").default(true).notNull(),

    // Platform configuration
    platforms: json("platforms").$type<string[]>().default([]).notNull(),

    // Notification settings
    notificationsEnabled: boolean("notifications_enabled")
      .default(true)
      .notNull(),
    notificationFrequency: notificationFrequencyEnum("notification_frequency")
      .default("daily")
      .notNull(),
    notificationChannels: json("notification_channels")
      .$type<{
        email: boolean;
        slack: boolean;
        webhook?: string;
      }>()
      .default({ email: true, slack: false })
      .notNull(),

    // Execution tracking
    lastExecutedAt: timestamp("last_executed_at", { mode: "date" }),
    nextExecutionAt: timestamp("next_execution_at", { mode: "date" }),
    executionCount: integer("execution_count").default(0).notNull(),

    // Performance metrics
    totalLeadsGenerated: integer("total_leads_generated").default(0).notNull(),
    averageRelevanceScore: real("average_relevance_score").default(0),

    // Unique color tag
    color: varchar("color", { length: 32 }).notNull(),

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("agents_user_id_idx").on(table.userId),
    statusIdx: index("agents_status_idx").on(table.status),
    nextExecutionIdx: index("agents_next_execution_idx").on(
      table.nextExecutionAt
    ),
    autoRunIdx: index("agents_auto_run_idx").on(table.isAutoRun),
  })
);

// Agent keywords - separate table for better querying
export const agentKeywords = pgTable(
  "agent_keywords",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: varchar("agent_id", { length: 128 })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    excludedKeywords: text("excluded_keywords"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    agentKeywordIdx: uniqueIndex("agent_keyword_unique").on(
      table.agentId,
      table.keyword
    ),
    agentIdIdx: index("agent_keywords_agent_id_idx").on(table.agentId),
  })
);

// Platform-specific configurations
export const agentPlatformConfigs = pgTable(
  "agent_platform_configs",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: varchar("agent_id", { length: 128 })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    config: json("config")
      .$type<{
        subreddits?: string[];
        twitterLists?: string[];
        linkedinCompanies?: string[];
        includeNSFW?: boolean;
        searchPosts?: boolean;
        searchComments?: boolean;
        minScore?: number;
        maxAge?: string; // "1d", "1w", etc.
      }>()
      .default({})
      .notNull(),
    isEnabled: boolean("is_enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    agentPlatformIdx: uniqueIndex("agent_platform_unique").on(
      table.agentId,
      table.platform
    ),
  })
);

// Enhanced monitoring results (leads)
export const monitoringResults = pgTable(
  "monitoring_results",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: varchar("agent_id", { length: 128 })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Platform data
    platform: platformEnum("platform").notNull(),
    platformPostId: text("platform_post_id"),
    platformCommentId: text("platform_comment_id"),

    // Content
    title: text("title"),
    content: text("content").notNull(),
    url: text("url").notNull(),

    // Author info
    author: text("author"),
    authorHandle: text("author_handle"),
    // authorKarma: integer("author_karma"),

    // Community/context
    community: text("community"),
    parentPost: text("parent_post_id"),

    // AI analysis
    relevanceScore: integer("relevance_score").notNull(),
    sentimentScore: integer("sentiment_score").default(0),
    // confidenceScore: real("confidence_score").default(0),
    matchedKeywords: text("matched_keywords"),
    // keywordMatches: integer("keyword_matches").default(0),

    // Semantic analysis
    semanticScore: real("semantic_score"),
    topicCategories: json("topic_categories").$type<string[]>().default([]),

    // Lead qualification
    isQualifiedLead: boolean("is_qualified_lead").default(false),
    leadScore: integer("lead_score").default(0), // 0-100
    buyingIntent: real("buying_intent").default(0), // 0-1

    // Notification status
    isNotified: boolean("is_notified").default(false),
    notificationSentAt: timestamp("notification_sent_at", { mode: "date" }),

    // Timestamps
    postCreatedAt: timestamp("post_created_at", { mode: "date" }),
    discoveredAt: timestamp("discovered_at", { mode: "date" })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),

    // Platform-specific metadata - engagement metrics and other details
    metadata: json("metadata").default({}),
    isArchived: boolean("is_archived").default(false).notNull(),
    archivedAt: timestamp("archived_at"),
  },
  (table) => ({
    // Prevent duplicates
    uniqueAgentUrl: uniqueIndex("unique_agent_url_monitoring").on(
      table.agentId,
      table.url
    ),

    // Performance indexes
    agentIdIdx: index("monitoring_results_agent_id_idx").on(table.agentId),
    userIdIdx: index("monitoring_results_user_id_idx").on(table.userId),
    platformIdx: index("monitoring_results_platform_idx").on(table.platform),
    relevanceScoreIdx: index("monitoring_results_relevance_score_idx").on(
      table.relevanceScore
    ),
    qualifiedLeadIdx: index("monitoring_results_qualified_lead_idx").on(
      table.isQualifiedLead
    ),
    discoveredAtIdx: index("monitoring_results_discovered_at_idx").on(
      table.discoveredAt
    ),
    notificationIdx: index("monitoring_results_notification_idx").on(
      table.isNotified
    ),
  })
);

// Agent execution history
export const agentExecutions = pgTable(
  "agent_executions",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    agentId: varchar("agent_id", { length: 128 })
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Execution info
    executionType: varchar("execution_type", { length: 20 }).notNull(), // 'auto', 'manual', 'scheduled'
    status: varchar("status", { length: 20 }).notNull(), // 'running', 'completed', 'failed', 'cancelled'

    // Results
    leadsGenerated: integer("leads_generated").default(0),
    postsAnalyzed: integer("posts_analyzed").default(0),
    platformsSearched: json("platforms_searched").$type<string[]>().default([]),

    // Performance
    executionTimeMs: integer("execution_time_ms"),
    averageRelevanceScore: real("average_relevance_score"),

    // Error handling
    error: text("error"),
    errorCode: varchar("error_code", { length: 50 }),

    // Timestamps
    startedAt: timestamp("started_at", { mode: "date" }).notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    agentIdIdx: index("agent_executions_agent_id_idx").on(table.agentId),
    statusIdx: index("agent_executions_status_idx").on(table.status),
    startedAtIdx: index("agent_executions_started_at_idx").on(table.startedAt),
  })
);

// Notification queue and history
export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    agentId: varchar("agent_id", { length: 128 }).references(() => agents.id, {
      onDelete: "set null",
    }),

    // Notification details
    type: varchar("type", { length: 20 }).notNull(), // 'lead', 'digest', 'system'
    channel: varchar("channel", { length: 20 }).notNull(), // 'email', 'slack', 'webhook'

    // Content
    title: text("title").notNull(),
    content: text("content").notNull(),
    metadata: json("metadata").default({}),

    // Lead references
    leadIds: json("lead_ids").$type<string[]>().default([]),
    leadCount: integer("lead_count").default(0),

    // Delivery
    status: varchar("status", { length: 20 }).default("pending"), // 'pending', 'sent', 'delivered', 'failed'
    sentAt: timestamp("sent_at", { mode: "date" }),
    deliveredAt: timestamp("delivered_at", { mode: "date" }),

    // Scheduling
    scheduledFor: timestamp("scheduled_for", { mode: "date" }),
    priority: integer("priority").default(5), // 1-10, higher = more urgent

    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    statusIdx: index("notifications_status_idx").on(table.status),
    scheduledForIdx: index("notifications_scheduled_for_idx").on(
      table.scheduledFor
    ),
    priorityIdx: index("notifications_priority_idx").on(table.priority),
  })
);

//Embeddings
export const embeddings = pgTable(
  "embeddings",
  {
    postId: text("post_id").notNull(),
    platform: text("platform").notNull(), // reddit, twitter, etc.
    content: text("content").notNull(), // raw text
    vector: vector("vector", { dimensions: 768 }).notNull(), // depends on model
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.platform] }),
  })
);

// Accounts table (for OAuth providers)
export const accounts = pgTable(
  "accounts",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    unique("provider_provider_account_id_unique").on(
      table.provider,
      table.providerAccountId
    ),
  ]
);

// Sessions table
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  sessionToken: text("session_token").unique().notNull(),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Verification tokens table
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// Feedback table - combined with testimonial functionality
export const feedback = pgTable("feedback", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 }).references(() => users.id, {
    onDelete: "set null",
  }),
  rating: integer("rating").notNull(),
  feedbackText: text("feedback_text"),
  email: text("email"),
  name: text("name"),
  company: text("company"),
  role: text("role"),
  allowTestimonial: boolean("allow_testimonial").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  featuredOrder: integer("featured_order"),
  eventType: text("event_type"),
  entityId: text("entity_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  agents: many(agents),
  monitoringResults: many(monitoringResults),
  notifications: many(notifications),
  agentExecutions: many(agentExecutions),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  keywords: many(agentKeywords),
  platformConfigs: many(agentPlatformConfigs),
  monitoringResults: many(monitoringResults),
  executions: many(agentExecutions),
  notifications: many(notifications),
}));

export const agentKeywordsRelations = relations(agentKeywords, ({ one }) => ({
  agent: one(agents, {
    fields: [agentKeywords.agentId],
    references: [agents.id],
  }),
}));

export const agentPlatformConfigsRelations = relations(
  agentPlatformConfigs,
  ({ one }) => ({
    agent: one(agents, {
      fields: [agentPlatformConfigs.agentId],
      references: [agents.id],
    }),
  })
);

export const monitoringResultsRelations = relations(
  monitoringResults,
  ({ one }) => ({
    agent: one(agents, {
      fields: [monitoringResults.agentId],
      references: [agents.id],
    }),
    user: one(users, {
      fields: [monitoringResults.userId],
      references: [users.id],
    }),
  })
);

export const agentExecutionsRelations = relations(
  agentExecutions,
  ({ one }) => ({
    agent: one(agents, {
      fields: [agentExecutions.agentId],
      references: [agents.id],
    }),
    user: one(users, {
      fields: [agentExecutions.userId],
      references: [users.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [notifications.agentId],
    references: [agents.id],
  }),
}));

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Feedback relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));
