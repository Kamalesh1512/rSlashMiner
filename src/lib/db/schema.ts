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
} from "drizzle-orm/pg-core";

import { createId } from "@paralleldrive/cuid2";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  password: text("password"),
  image: text("image"),
  subscriptionTier: text("subscription_tier").default("free").notNull(), // free, pro, premium
  subscriptionExpiresAt: timestamp("subscription_expires_at", { mode: "date" }),
  dodoCustomerId:text('dodo_customer_id'),
  dodoSubscriptionId:text('dodo_subscription_id'),
  cancelAtPeriodEnd:boolean('cancel_at_period_end').default(false),
  paidUserIndex:integer('paid_user_index'),
  slackUserId:text('slack_user_id'),
  slackAccessToken:text('slack_access_token'),
  teamId:text('team_id'),
  slackDmChannelId:text('slack_dm_channel_id'),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  agents: many(agents),
}));

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
      unique(
        "provider_provider_account_id_unique"
      ).on(table.provider, table.providerAccountId),
    
    ]
);

// Account relations
export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

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

// Session relations
export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// Verification tokens table
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
   primaryKey({ columns: [table.identifier, table.token] }),
    
  ]
);

// Agents table - for AI agent configurations
export const agents = pgTable("agents", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  configuration: text("configuration").notNull(), // Stores agent configuration as JSON
  lastRunAt: timestamp("last_run_at", { mode: "date" }),
  runCount: integer("run_count").default(0).notNull(),
})

// Agent relations
export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(users, {
    fields: [agents.userId],
    references: [users.id],
  }),
  keywords: many(keywords),
  subreddits: many(subreddits),
  monitoringResults: many(monitoringResults),
  notifications: many(notifications),
}))

// Keywords table - for tracking keywords
export const keywords = pgTable("keywords", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  agentId: varchar("agent_id", { length: 128 })
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

// Keyword relations
export const keywordsRelations = relations(keywords, ({ one }) => ({
  agent: one(agents, {
    fields: [keywords.agentId],
    references: [agents.id],
  }),
}))

// Subreddits table - for tracking subreddits
export const subreddits = pgTable("subreddits", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  agentId: varchar("agent_id", { length: 128 })
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  subredditName: text("subreddit_name").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

// Subreddit relations
export const subredditsRelations = relations(subreddits, ({ one }) => ({
  agent: one(agents, {
    fields: [subreddits.agentId],
    references: [agents.id],
  }),
}))

// Monitoring results table - for storing Reddit monitoring results
export const monitoringResults = pgTable("monitoring_results", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  agentId: varchar("agent_id", { length: 128 })
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  redditPostId: text("reddit_post_id").unique(),
  redditCommentId: text("reddit_comment_id").unique(),
  content: text("content").notNull(),
  author: text("author"),
  subreddit: text("subreddit"),
  url: text("url"),
  score: integer("score"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  matchedKeywords: text("matched_keywords"),
  relevanceScore: integer("relevance_score"), // AI-determined relevance score
  numComments: varchar("num_comments"),
  sentimentScore: integer("sentiment_score"), // Sentiment analysis score
})

// Monitoring result relations
export const monitoringResultsRelations = relations(monitoringResults, ({ one }) => ({
  agent: one(agents, {
    fields: [monitoringResults.agentId],
    references: [agents.id],
  }),
}))

// Notification settings table - for user notification preferences
export const notificationSettings = pgTable("notification_settings", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  whatsappEnabled: boolean("whatsapp_enabled").default(false).notNull(),
  whatsappNumber: text("whatsapp_number"),
  minimumRelevanceScore: integer("minimum_relevance_score").default(70).notNull(), // Only notify if relevance score is above this
  dailyDigestEnabled: boolean("daily_digest_enabled").default(false).notNull(),
  digestTime: text("digest_time").default("09:00").notNull(), // Time for daily digest in HH:MM format
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
})

// Notification settings relations
export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}))

// Notifications table - for storing sent notifications
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id", { length: 128 }).references(() => agents.id, { onDelete: "set null" }),
  type: text("type").notNull(), // email, whatsapp, digest
  content: text("content").notNull(),
  sentAt: timestamp("sent_at", { mode: "date" }).defaultNow().notNull(),
  status: text("status").notNull(), // sent, delivered, failed
  resultId: varchar("result_id", { length: 128 }).references(() => monitoringResults.id, { onDelete: "set null" }),
})

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [notifications.agentId],
    references: [agents.id],
  }),
  result: one(monitoringResults, {
    fields: [notifications.resultId],
    references: [monitoringResults.id],
  }),
}))

// Usage limits table - for tracking user usage against their subscription limits
export const usageLimits = pgTable("usage_limits", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  period: text("period").notNull(), // daily, monthly
  agentCreationCount: integer("agent_creation_count").default(0).notNull(),
  keywordTrackCount: integer("keyword_track_count").default(0).notNull(),
  manualRunCount: integer("manual_run_count").default(0).notNull(),
  scheduledRunCount: integer("scheduled_run_count").default(0).notNull(),
  lastResetAt: timestamp("last_reset_at", { mode: "date" }).defaultNow().notNull(),
})

// Usage limits relations
export const usageLimitsRelations = relations(usageLimits, ({ one }) => ({
  user: one(users, {
    fields: [usageLimits.userId],
    references: [users.id],
  }),
}))


// Scheduled runs table
export const scheduledRuns = pgTable("scheduled_runs", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  agentId: varchar("agent_id", { length: 128 })
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduled_for", { mode: "date" }).notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed
  startedAt: timestamp("started_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  result: text("result"), // JSON result of the run
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
})

// Scheduled runs relations
export const scheduledRunsRelations = relations(scheduledRuns, ({ one }) => ({
  agent: one(agents, {
    fields: [scheduledRuns.agentId],
    references: [agents.id],
  }),
}))

// Run history table
export const runHistory = pgTable("run_history", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  agentId: varchar("agent_id", { length: 128 })
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 128 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  success: boolean("success"),
  resultsCount: integer("results_count").default(0),
  processedKeywords: integer("processed_keywords").default(0),
  summary: text("summary"),
  error: text("error"),
  isScheduled: boolean("is_scheduled").default(false),
  steps: text("steps"), // JSON array of steps
})

// Run history relations
export const runHistoryRelations = relations(runHistory, ({ one }) => ({
  agent: one(agents, {
    fields: [runHistory.agentId],
    references: [agents.id],
  }),
  user: one(users, {
    fields: [runHistory.userId],
    references: [users.id],
  }),
}))



// Feedback table - combined with testimonial functionality
export const feedback = pgTable("feedback", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: varchar("user_id", { length: 128 }).references(() => users.id, { onDelete: "set null" }),
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
})

// Feedback relations
export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}))


export const waitlist = pgTable("waitlist", {
  id: varchar("id", { length: 128 })
    .primaryKey()
    .$defaultFn(() => createId()),
  email: varchar("email", { length: 128 }).notNull()
  
});