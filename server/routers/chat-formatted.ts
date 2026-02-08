/**
 * Chat router for Workforce Luxembourg with proper response format
 * All responses follow the exact specification with evidence
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  addMessage,
  addMessageSources,
  createConversation,
  deleteConversation,
  getConversationWithMessages,
  getConversations,
  getUserPreferences,
  updateConversationTitle,
  upsertUserPreferences,
} from "../db";
import { generateChatResponse, routeQuery } from "../llm";
import { searchKnowledgeBase } from "../knowledge-base";
import { formatChatResponse } from "@shared/response-format";
import type { Language, ExpertiseMode } from "@shared/types";
import type { ChatResponse } from "@shared/response-format";

// Extend response source type to include section and excerpt
type ResponseSource = {
  title: string;
  url: string;
  type: "guichet" | "official" | "other";
  section?: string;
  excerpt?: string;
};

function getDisclaimer(mode: ExpertiseMode): string {
  const disclaimers = {
    procedural:
      "This information is based on official Guichet.lu sources and current Luxembourg employment regulations. Always verify with official sources for critical decisions.",
    legal: "This is not legal advice. For legal matters, please consult with a qualified employment law attorney. Information is based on current Luxembourg law.",
    ai_innovation:
      "This response includes AI-generated suggestions and may not be based on official sources. Use for inspiration only and verify all information independently.",
  };
  return disclaimers[mode];
}

export const chatFormattedRouter = router({
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

      return result;
    }),

  /**
   * Send a message and get AI response in the exact specification format
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        mode: z.enum(["procedural", "legal", "ai_innovation"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }): Promise<ChatResponse> => {
      const conversation = await getConversationWithMessages(input.conversationId);
      if (!conversation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversation not found",
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

        const language = (conversation.conversation.language as Language) || "en";

        // Search knowledge base for relevant sources
        const relevantSources = searchKnowledgeBase(input.content, 5);

        // Build conversation history for context
        const history = conversation.messages
          .filter((m) => m.sender !== "system")
          .slice(-6)
          .map((m) => ({
            role: m.sender as "user" | "assistant",
            content: m.content,
          }));

        // Generate AI response
        const response = await generateChatResponse({
          userMessage: input.content,
          conversationHistory: history,
          language,
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
            response.sources.map((s, idx) => ({
              messageId: assistantMessage.id,
              sourceTitle: s.title,
              sourceUrl: s.url,
              sourceType: s.type,
            }))
          );
        }

        // Format response according to specification
        const formattedResponse = formatChatResponse(
          language,
          response.content,
          response.sources.map((s) => ({
            title: s.title,
            url: s.url,
            section: "General",
            content: "",
          })),
          {
            steps: extractSteps(response.content),
            confidence: determineConfidence(mode, response.sources.length),
            limitations: [getDisclaimer(mode)],
            suggested_searches: generateSuggestedSearches(input.content, language),
          }
        );

        return formattedResponse;
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
      return await upsertUserPreferences(ctx.user.id, input);
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
    .mutation(async ({ input }) => {
      return await updateConversationTitle(input.conversationId, input.title);
    }),

  /**
   * Delete a conversation
   */
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteConversation(input.conversationId);
    }),
});

/**
 * Helper functions for response formatting
 */

function extractSteps(content: string): string[] {
  // Extract numbered or bulleted steps from the response
  const steps: string[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Match patterns like "1.", "- ", "* "
    if (/^\s*(\d+\.|[-*])\s+/.test(line)) {
      const step = line.replace(/^\s*(\d+\.|[-*])\s+/, "").trim();
      if (step) steps.push(step);
    }
  }

  return steps.length > 0 ? steps : [];
}

function determineConfidence(mode: ExpertiseMode, sourceCount: number): "high" | "medium" | "low" {
  if (mode === "legal") return sourceCount > 0 ? "medium" : "low";
  if (mode === "ai_innovation") return "low";
  return sourceCount > 2 ? "high" : sourceCount > 0 ? "medium" : "low";
}

function generateSuggestedSearches(query: string, language: Language): string[] {
  // Generate related search suggestions based on the query
  const suggestions: Record<Language, Record<string, string[]>> = {
    en: {
      employment: ["Employment contracts", "Employee rights", "Termination procedures"],
      salary: ["Minimum wage", "Salary deductions", "Overtime compensation"],
      leave: ["Annual leave", "Sick leave", "Maternity leave"],
      adem: ["ADEM registration", "Job seeking", "Unemployment benefits"],
    },
    fr: {
      emploi: ["Contrats de travail", "Droits des salariés", "Procédures de résiliation"],
      salaire: ["Salaire minimum", "Déductions salariales", "Compensation des heures supplémentaires"],
      congé: ["Congés annuels", "Congés maladie", "Congé maternité"],
      adem: ["Inscription à l'ADEM", "Recherche d'emploi", "Allocations de chômage"],
    },
    de: {
      beschäftigung: ["Arbeitsverträge", "Arbeitnehmerrechte", "Kündigungsverfahren"],
      gehalt: ["Mindestlohn", "Gehaltsabzüge", "Überstundenvergütung"],
      urlaub: ["Jahresurlaub", "Krankheitsurlaub", "Mutterschaftsurlaub"],
      adem: ["ADEM-Registrierung", "Jobsuche", "Arbeitslosenleistungen"],
    },
  };

  const queryLower = query.toLowerCase();
  for (const [key, searches] of Object.entries(suggestions[language] || {})) {
    if (queryLower.includes(key)) {
      return searches;
    }
  }

  return ["Employment procedures", "Employee rights", "Support programmes"];
}
