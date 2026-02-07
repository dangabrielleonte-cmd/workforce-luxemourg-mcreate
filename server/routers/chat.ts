/**
 * Chat router for Workforce Luxembourg
 * Handles chat messages, conversation management, and AI responses
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  addMessage,
  addMessageSources,
  createConversation,
  deleteConversation,
  getConversationWithMessages,
  getConversations,
  getSharedConversations,
  getUserPreferences,
  hasConversationAccess,
  removeConversationShare,
  shareConversation,
  updateConversationTitle,
  upsertUserPreferences,
} from "../db";
import { generateChatResponse, routeQuery } from "../llm";
import type { Language, ExpertiseMode } from "@shared/types";

export const chatRouter = router({
  /**
   * Create a new conversation
   */
  createConversation: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        language: z.enum(["en", "fr", "de"]).default("en"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await createConversation({
        userId: ctx.user.id,
        title: input.title || "New Conversation",
        language: input.language,
      });

      // Update user preferences with language
      await upsertUserPreferences(ctx.user.id, {
        preferredLanguage: input.language,
      });

      return conversation;
    }),

  /**
   * Get all conversations for the current user
   */
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    return await getConversations(ctx.user.id);
  }),

  /**
   * Get a specific conversation with all messages
   */
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await getConversationWithMessages(input.conversationId);

      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      // Check if user has access (owner or shared)
      const hasAccess = await hasConversationAccess(input.conversationId, ctx.user.id);

      if (!hasAccess) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this conversation",
        });
      }

      return result;
    }),

  /**
   * Send a message and get AI response
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        mode: z.enum(["procedural", "legal", "ai_innovation"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify conversation ownership
      const conversation = await getConversationWithMessages(input.conversationId);
      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (conversation.conversation.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this conversation",
        });
      }

      // Save user message
      const userMessage = await addMessage({
        conversationId: input.conversationId,
        sender: "user",
        content: input.content,
      });

      try {
        // Determine mode if not provided
        let mode: ExpertiseMode = input.mode || "procedural";
        if (!input.mode) {
          const routing = await routeQuery(
            input.content,
            (conversation.conversation.language as Language) || "en"
          );
          mode = routing.mode;
        }

        // Build conversation history for context
        const history = conversation.messages
          .filter((m) => m.sender !== "system")
          .slice(-6) // Last 6 messages for context
          .map((m) => ({
            role: m.sender as "user" | "assistant",
            content: m.content,
          }));

        // Generate AI response
        const response = await generateChatResponse({
          userMessage: input.content,
          conversationHistory: history,
          language: (conversation.conversation.language as Language) || "en",
          mode,
        });

        // Save assistant message
        const assistantMessage = await addMessage({
          conversationId: input.conversationId,
          sender: "assistant",
          content: response.content,
          mode,
        });

        // Save sources
        if (response.sources.length > 0) {
          await addMessageSources(
            assistantMessage.id,
            response.sources.map((s) => ({
              messageId: assistantMessage.id,
              sourceTitle: s.title,
              sourceUrl: s.url,
              sourceType: s.type,
            }))
          );
        }

        return {
          userMessage,
          assistantMessage: {
            ...assistantMessage,
            sources: response.sources.map((s) => ({
              sourceTitle: s.title,
              sourceUrl: s.url,
              sourceType: s.type,
            })),
          },
          mode,
          disclaimer: getDisclaimer(mode),
        };
      } catch (error) {
        console.error("Error generating response:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate response",
        });
      }
    }),

  /**
   * Get user preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getUserPreferences(ctx.user.id);
    return (
      prefs || {
        userId: ctx.user.id,
        preferredLanguage: "en",
      }
    );
  }),

  /**
   * Update user preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferredLanguage: z.enum(["en", "fr", "de"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertUserPreferences(ctx.user.id, input);
      return await getUserPreferences(ctx.user.id);
    }),

  /**
   * Delete a conversation
   */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const conversation = await getConversationWithMessages(input.conversationId);

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (conversation.conversation.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the conversation owner can delete it",
        });
      }

      await deleteConversation(input.conversationId);
      return { success: true };
    }),

  /**
   * Rename a conversation
   */
  renameConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        title: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await getConversationWithMessages(input.conversationId);

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (conversation.conversation.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the conversation owner can rename it",
        });
      }

      await updateConversationTitle(input.conversationId, input.title);
      return { ...conversation.conversation, title: input.title };
    }),

  /**
   * Share a conversation with another user
   */
  shareConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        sharedWithUserId: z.number(),
        permission: z.enum(["view", "edit", "admin"]).default("view"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await getConversationWithMessages(input.conversationId);

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (conversation.conversation.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the conversation owner can share it",
        });
      }

      return await shareConversation(
        input.conversationId,
        input.sharedWithUserId,
        input.permission
      );
    }),

  /**
   * Get conversations shared with the current user
   */
  getSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
    return await getSharedConversations(ctx.user.id);
  }),

  /**
   * Remove conversation share
   */
  removeShare: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        sharedWithUserId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await getConversationWithMessages(input.conversationId);

      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
        });
      }

      if (conversation.conversation.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the conversation owner can remove shares",
        });
      }

      await removeConversationShare(input.conversationId, input.sharedWithUserId);
      return { success: true };
    }),
});

/**
 * Get appropriate disclaimer based on expertise mode
 */
function getDisclaimer(mode: ExpertiseMode): string {
  const disclaimers = {
    procedural:
      "This information is based on official sources. Procedures and requirements may change. Always verify with the official sources linked below before taking action.",
    legal:
      "This is general information and not legal advice. Laws and regulations can change. For legal decisions, consult a qualified lawyer.",
    ai_innovation:
      "This information is based on public sources. For detailed eligibility and application, verify with the official sources linked below.",
  };

  return disclaimers[mode];
}
