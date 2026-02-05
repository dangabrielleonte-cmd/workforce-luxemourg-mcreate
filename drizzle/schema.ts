import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table for storing chat sessions.
 * Supports both authenticated users and embedded scenarios with site keys.
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  externalSiteKey: varchar("externalSiteKey", { length: 128 }),
  title: varchar("title", { length: 255 }).default("New Conversation"),
  language: varchar("language", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table for storing individual messages in conversations.
 * Supports user, assistant, and system messages.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  sender: mysqlEnum("sender", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  mode: mysqlEnum("mode", ["procedural", "legal", "ai_innovation"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Message sources table for storing citations and references.
 * Links messages to their source materials from Guichet.lu and other official sources.
 */
export const messageSources = mysqlTable("messageSources", {
  id: int("id").autoincrement().primaryKey(),
  messageId: int("messageId")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  sourceTitle: varchar("sourceTitle", { length: 255 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 2048 }).notNull(),
  sourceType: mysqlEnum("sourceType", ["guichet", "official", "other"]).default("other"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MessageSource = typeof messageSources.$inferSelect;
export type InsertMessageSource = typeof messageSources.$inferInsert;

/**
 * Integrations table for managing embedded widget configurations.
 * Stores site-specific settings for embedded assistants.
 */
export const integrations = mysqlTable("integrations", {
  id: int("id").autoincrement().primaryKey(),
  ownerUserId: int("ownerUserId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  siteName: varchar("siteName", { length: 255 }).notNull(),
  siteKey: varchar("siteKey", { length: 128 }).notNull().unique(),
  config: text("config"), // JSON: { primaryColor, logo, defaultLanguage, defaultMode }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = typeof integrations.$inferInsert;

/**
 * Events table for analytics and monitoring.
 * Tracks user actions, chat events, and system events.
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  integrationId: int("integrationId").references(() => integrations.id, { onDelete: "set null" }),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  metadata: text("metadata"), // JSON: event-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * User preferences table for storing language and other user settings.
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;