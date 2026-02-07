import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  conversations,
  conversationShares,
  events,
  integrations,
  messageSources,
  messages,
  userPreferences,
  users,
  type Conversation,
  type ConversationShare,
  type Event,
  type InsertConversation,
  type InsertConversationShare,
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

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Create a conversation
 */
export async function createConversation(data: InsertConversation): Promise<Conversation> {
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
 * Get all conversations for a user
 */
export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(conversations.createdAt);
}

/**
 * Get conversations by external site key
 */
export async function getConversationsBySiteKey(externalSiteKey: string) {
  const db = await getDb();
  if (!db) return [];

  if (externalSiteKey) {
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

/**
 * Share a conversation with another user
 */
export async function shareConversation(
  conversationId: number,
  sharedWithUserId: number,
  permission: "view" | "edit" | "admin" = "view"
): Promise<ConversationShare> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversationShares).values({
    conversationId,
    sharedWithUserId,
    permission,
  });

  const shareId = result[0].insertId as number;
  const created = await db
    .select()
    .from(conversationShares)
    .where(eq(conversationShares.id, shareId))
    .limit(1);

  if (!created.length) throw new Error("Failed to share conversation");
  return created[0];
}

/**
 * Get conversations shared with a user
 */
export async function getSharedConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const shares = await db
    .select()
    .from(conversationShares)
    .where(eq(conversationShares.sharedWithUserId, userId));

  if (shares.length === 0) return [];

  const conversationIds = shares.map((s) => s.conversationId);
  const convs = await db
    .select()
    .from(conversations)
    .where(inArray(conversations.id, conversationIds));

  return convs.map((conv) => ({
    conversation: conv,
    share: shares.find((s) => s.conversationId === conv.id)!,
  }));
}

/**
 * Remove conversation share
 */
export async function removeConversationShare(
  conversationId: number,
  sharedWithUserId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(conversationShares)
    .where(
      and(
        eq(conversationShares.conversationId, conversationId),
        eq(conversationShares.sharedWithUserId, sharedWithUserId)
      )
    );
}

/**
 * Check if user has access to conversation (owner or shared)
 */
export async function hasConversationAccess(
  conversationId: number,
  userId: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if user is owner
  const ownedConv = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);

  if (ownedConv.length > 0) return true;

  // Check if conversation is shared with user
  const sharedConv = await db
    .select()
    .from(conversationShares)
    .where(
      and(
        eq(conversationShares.conversationId, conversationId),
        eq(conversationShares.sharedWithUserId, userId)
      )
    )
    .limit(1);

  return sharedConv.length > 0;
}

/**
 * Get user preferences
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
 * Upsert user preferences
 */
export async function upsertUserPreferences(userId: number, prefs: Partial<InsertUserPreference>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .insert(userPreferences)
    .values({
      userId,
      ...prefs,
    })
    .onDuplicateKeyUpdate({
      set: prefs,
    });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(conversations).where(eq(conversations.id, conversationId));
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: number,
  title: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}
