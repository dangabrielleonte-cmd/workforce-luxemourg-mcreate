import { describe, it, expect, beforeEach, vi } from "vitest";
import { chatRouter } from "./chat";
import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "../_core/context";

// Mock database functions
vi.mock("../db", () => ({
  createConversation: vi.fn(async (data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getConversations: vi.fn(async () => []),
  getConversationWithMessages: vi.fn(async () => null),
  addMessage: vi.fn(async (data) => ({
    id: 1,
    ...data,
    createdAt: new Date(),
  })),
  addMessageSources: vi.fn(async () => {}),
  getUserPreferences: vi.fn(async () => null),
  upsertUserPreferences: vi.fn(async () => ({})),
}));

// Mock LLM functions
vi.mock("../llm", () => ({
  routeQuery: vi.fn(async () => ({
    mode: "procedural",
    confidence: 0.95,
    reasoning: "Question asks about procedures",
  })),
  generateChatResponse: vi.fn(async () => ({
    content: "Test response",
    mode: "procedural",
    sources: [
      {
        title: "Test Source",
        url: "https://guichet.lu/test",
        type: "guichet",
      },
    ],
  })),
}));

function createMockContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "oauth",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("chatRouter", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  describe("createConversation", () => {
    it("creates a new conversation", async () => {
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.createConversation({
        title: "Test Conversation",
        language: "en",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Conversation");
      expect(result.language).toBe("en");
    });

    it("creates conversation with default title", async () => {
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.createConversation({
        language: "fr",
      });

      expect(result).toBeDefined();
      expect(result.language).toBe("fr");
    });
  });

  describe("listConversations", () => {
    it("lists conversations for authenticated user", async () => {
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.listConversations();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getPreferences", () => {
    it("returns user preferences", async () => {
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.getPreferences();

      expect(result).toBeDefined();
      expect(result.userId).toBe(ctx.user.id);
    });
  });

  describe("updatePreferences", () => {
    it("updates user preferences", async () => {
      const caller = chatRouter.createCaller(ctx);

      const result = await caller.updatePreferences({
        preferredLanguage: "de",
      });

      expect(result).toBeDefined();
    });
  });

  describe("deleteConversation", () => {
    it("requires conversation to exist", async () => {
      const caller = chatRouter.createCaller(ctx);

      try {
        await caller.deleteConversation({
          conversationId: 999,
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
      }
    });
  });

  describe("renameConversation", () => {
    it("requires conversation to exist", async () => {
      const caller = chatRouter.createCaller(ctx);

      try {
        await caller.renameConversation({
          conversationId: 999,
          title: "New Title",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
      }
    });

    it("validates title length", async () => {
      const caller = chatRouter.createCaller(ctx);

      try {
        await caller.renameConversation({
          conversationId: 1,
          title: "",
        });
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
