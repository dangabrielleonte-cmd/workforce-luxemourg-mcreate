import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  conversations,
  events,
  integrations,
  messageSources,
  messages,
  userPreferences,
  users,
  type Conversation,
  type Event,
  type InsertConversation,
  type InsertEvent,
  type InsertIntegration,
  type InsertMessage,
  type InsertMessageSource,
  type InsertUser,
  type InsertUserPreference,
  type Integration,
  type Message,
  type MessageSource,
  type User,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user preferences or create default
 */
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create or update user preferences
 */
export async function upsertUserPreferences(
  userId: number,
  preferences: Partial<InsertUserPreference>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserPreferences(userId);

  if (existing) {
    await db
      .update(userPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      })
      .where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({
      userId,
      ...preferences,
    });
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  data: InsertConversation
): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(data);
  const conversationId = result[0].insertId as number;

  const created = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!created.length) throw new Error("Failed to create conversation");
  return created[0];
}

/**
 * Get conversations for a user or site key
 */
export async function getConversations(
  userId?: number,
  externalSiteKey?: string
) {
  const db = await getDb();
  if (!db) return [];

  if (userId) {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(conversations.createdAt);
  } else if (externalSiteKey) {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.externalSiteKey, externalSiteKey))
      .orderBy(conversations.createdAt);
  }

  return [];
}

/**
 * Get a single conversation with messages and sources
 */
export async function getConversationWithMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return null;

  const conversation = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation.length) return null;

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  // Get sources for all messages
  const msgIds = msgs.map((m) => m.id);
  let sources: MessageSource[] = [];
  if (msgIds.length > 0) {
    sources = await db
      .select()
      .from(messageSources)
      .where(inArray(messageSources.messageId, msgIds));
  }

  return {
    conversation: conversation[0],
    messages: msgs.map((msg) => ({
      ...msg,
      sources: sources.filter((s) => s.messageId === msg.id),
    })),
  };
}

/**
 * Add a message to a conversation
 */
export async function addMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  const messageId = result[0].insertId as number;

  const created = await db
    .select()
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!created.length) throw new Error("Failed to create message");
  return created[0];
}

/**
 * Add sources to a message
 */
export async function addMessageSources(
  messageId: number,
  sources: InsertMessageSource[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (sources.length === 0) return;

  await db.insert(messageSources).values(
    sources.map((s) => ({
      ...s,
      messageId,
    }))
  );
}

/**
 * Create an integration
 */
export async function createIntegration(
  data: InsertIntegration
): Promise<Integration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(integrations).values(data);
  const integrationId = result[0].insertId as number;

  const created = await db
    .select()
    .from(integrations)
    .where(eq(integrations.id, integrationId))
    .limit(1);

  if (!created.length) throw new Error("Failed to create integration");
  return created[0];
}

/**
 * Get integrations for a user
 */
export async function getUserIntegrations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(integrations)
    .where(eq(integrations.ownerUserId, userId))
    .orderBy(integrations.createdAt);
}

/**
 * Get integration by site key
 */
export async function getIntegrationBySiteKey(siteKey: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(integrations)
    .where(eq(integrations.siteKey, siteKey))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Create an event for analytics
 */
export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create event: database not available");
    return;
  }

  try {
    await db.insert(events).values(data);
  } catch (error) {
    console.error("[Database] Failed to create event:", error);
  }
}

/**
 * Get analytics for an integration
 */
export async function getIntegrationAnalytics(integrationId: number) {
  const db = await getDb();
  if (!db) return null;

  const eventCount = await db
    .select()
    .from(events)
    .where(eq(events.integrationId, integrationId));

  return {
    totalEvents: eventCount.length,
    events: eventCount,
  };
}
