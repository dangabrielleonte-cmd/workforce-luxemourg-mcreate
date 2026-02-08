/**
 * Chat procedure with real knowledge base integration
 * Uses Guichet.lu content to provide accurate, sourced answers
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { addMessage, addMessageSources, createConversation, getConversationWithMessages } from "../db";
import { invokeLLM } from "../_core/llm";
import { searchKnowledgeBase, extractExcerpts } from "../knowledge-base";
import type { GuichetContent } from "../scrapers/guichet";

const ChatInputSchema = z.object({
  conversationId: z.number().optional(),
  message: z.string().min(1).max(5000),
  language: z.enum(["en", "fr", "de"]).default("en"),
});

type ChatInput = z.infer<typeof ChatInputSchema>;

/**
 * Build system prompt with knowledge base context
 */
function buildSystemPrompt(
  relevantContent: GuichetContent[],
  language: "en" | "fr" | "de"
): string {
  const contentSummary = relevantContent
    .map((c) => `Title: ${c.title}\nSection: ${c.section}\nContent: ${c.content.substring(0, 500)}...`)
    .join("\n\n---\n\n");

  const languageGuide = {
    en: "You are a helpful HR and employment law assistant for Luxembourg. Use the provided Guichet.lu content to answer questions accurately. Always cite your sources.",
    fr: "Vous êtes un assistant utile en matière de droit du travail et des ressources humaines pour le Luxembourg. Utilisez le contenu fourni de Guichet.lu pour répondre avec précision. Citez toujours vos sources.",
    de: "Sie sind ein hilfreicher HR- und Arbeitsrechtsassistent für Luxemburg. Nutzen Sie den bereitgestellten Guichet.lu-Inhalt, um Fragen genau zu beantworten. Zitieren Sie immer Ihre Quellen.",
  };

  return `${languageGuide[language]}

RELEVANT KNOWLEDGE BASE CONTENT:
${contentSummary || "No specific content found. Provide general guidance based on Luxembourg HR and employment law."}

INSTRUCTIONS:
1. Answer the user's question based on the provided content
2. If the answer is found in the content, cite the specific source
3. If information is not in the provided content, say so clearly
4. Provide practical, actionable advice
5. Include relevant disclaimers for legal matters
6. Format your response with clear sections`;
}

/**
 * Send a chat message with knowledge base integration
 */
export const chatWithKBProcedure = protectedProcedure
  .input(ChatInputSchema)
  .mutation(async ({ ctx, input }) => {
    const { conversationId, message, language } = input;

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await createConversation({
        userId: ctx.user.id,
        title: message.substring(0, 100),
        language,
      });
      convId = conv.id;
    }

    // Search knowledge base for relevant content
    const relevantContent = searchKnowledgeBase(message, 5);

    // Build system prompt with knowledge base context
    const systemPrompt = buildSystemPrompt(relevantContent, language);

    // Call LLM with knowledge base context
    const llmResponse = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
    });

    const responseContent = llmResponse.choices[0]?.message.content;
    const responseText =
      typeof responseContent === "string"
        ? responseContent
        : "Unable to generate response";

    // Save user message
    const userMessage = await addMessage({
      conversationId: convId,
      sender: "user",
      content: message,
    });

    // Save assistant message
    const assistantMessage = await addMessage({
      conversationId: convId,
      sender: "assistant",
      content: responseText,
    });

    // Add sources to assistant message
    if (relevantContent.length > 0) {
      const sources = relevantContent.map((content) => ({
        messageId: assistantMessage.id,
        sourceTitle: content.title,
        sourceUrl: content.url,
        sourceType: "guichet" as const,
      }));

      await addMessageSources(assistantMessage.id, sources);
    }

    // Get updated conversation
    const updatedConversation = await getConversationWithMessages(convId);

    return {
      conversationId: convId,
      message: assistantMessage,
      sources: relevantContent.map((c) => ({
        title: c.title,
        url: c.url,
        section: c.section,
        sourceType: "guichet" as const,
      })),
      updatedConversation,
    };
  });

export const chatKBRouter = router({
  sendMessage: chatWithKBProcedure,
});
