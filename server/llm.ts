/**
 * LLM integration for Workforce Luxembourg
 * Handles query routing, response generation, and source extraction
 */

import { invokeLLM } from "./_core/llm";
import type { ExpertiseMode, Language } from "@shared/types";

export interface QueryRoutingResult {
  mode: ExpertiseMode;
  confidence: number;
  reasoning: string;
}

export interface LLMChatRequest {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  language: Language;
  mode?: ExpertiseMode;
  sources?: string;
}

export interface LLMChatResponse {
  content: string;
  mode: ExpertiseMode;
  sources: Array<{
    title: string;
    url: string;
    type: "guichet" | "official" | "other";
  }>;
}

/**
 * Route a query to the appropriate expertise mode
 */
export async function routeQuery(
  userMessage: string,
  language: Language = "en"
): Promise<QueryRoutingResult> {
  const systemPrompt = `You are a query router for a Luxembourg HR and employment law assistant. 
Analyze the user's question and classify it into one of three expertise modes:

1. "procedural" - How-to and process flows (e.g., "How do I register as a job-seeker?", "What are the steps for inclusion assistance?")
2. "legal" - Legal structure, obligations, and rights (e.g., "What are the obligations for temporary agency work?", "What are employee rights?")
3. "ai_innovation" - AI support programmes and innovation initiatives (e.g., "What AI support is available for SMEs?")

Respond in JSON format with: { "mode": "procedural|legal|ai_innovation", "confidence": 0-1, "reasoning": "brief explanation" }`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Classify this query (${language}): "${userMessage}"` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "query_routing",
        strict: true,
        schema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["procedural", "legal", "ai_innovation"],
            },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            reasoning: { type: "string" },
          },
          required: ["mode", "confidence", "reasoning"],
          additionalProperties: false,
        },
      },
    },
  });

  const messageContent = response.choices[0]?.message.content;
  if (!messageContent) throw new Error("Failed to route query");

  const contentStr = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent);
  const parsed = JSON.parse(contentStr);
  return {
    mode: parsed.mode,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
  };
}

/**
 * Generate a chat response using LLM with context
 */
export async function generateChatResponse(
  request: LLMChatRequest
): Promise<LLMChatResponse> {
  const systemPrompt = buildSystemPrompt(request.mode || "procedural", request.language);

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...request.conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: request.userMessage },
  ];

  const contextMessage = request.sources
    ? `\n\nRelevant sources:\n${request.sources}`
    : "";

  if (messages.length > 0 && messages[messages.length - 1].role === "user") {
    messages[messages.length - 1].content += contextMessage;
  }

  const response = await invokeLLM({
    messages: messages as Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }>,
  });

  const messageContent = response.choices[0]?.message.content;
  if (!messageContent) throw new Error("Failed to generate response");

  // Handle both string and array content
  const content = typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent);

  // Extract sources from content (simple pattern matching for now)
  const sources = extractSources(content);

  return {
    content: content || "",
    mode: request.mode || "procedural",
    sources,
  };
}

/**
 * Build system prompt based on expertise mode and language
 */
function buildSystemPrompt(mode: ExpertiseMode, language: Language): string {
  const languageNote =
    language === "fr"
      ? "Respond in French."
      : language === "de"
        ? "Respond in German."
        : "Respond in English.";

  const modeInstructions = {
    procedural: `You are a helpful HR assistant for Luxembourg. Focus on providing clear, step-by-step procedures and process flows. 
When answering, provide:
1. A clear 2-4 sentence summary
2. Numbered step-by-step instructions
3. Key conditions and requirements
4. Relevant contact points or resources

Always reference official sources like Guichet.lu and include links.`,

    legal: `You are an employment law expert for Luxembourg. Focus on legal structures, obligations, and rights.
When answering, provide:
1. A clear 2-4 sentence summary
2. Structured explanations with sections like "Who is concerned?", "Key conditions", "Obligations"
3. Relevant legal references
4. Important disclaimers about consulting professionals

Always reference official sources and include links.`,

    ai_innovation: `You are an expert on AI and innovation support programmes in Luxembourg. Focus on eligibility, support types, and application processes.
When answering, provide:
1. A clear 2-4 sentence summary
2. Programme details and eligibility criteria
3. Types of support available
4. How to apply
5. Relevant contact information

Always reference official sources like Guichet.lu and include links.`,
  };

  return `${modeInstructions[mode]}

${languageNote}

Important: 
- This is general information based on public sources. It is not legal or professional advice.
- Always include citations to official sources (especially Guichet.lu)
- Include relevant URLs in your response
- Encourage users to verify information with official sources
- For legal decisions, recommend consulting qualified professionals`;
}

/**
 * Extract sources from LLM response (simple pattern matching)
 */
export function extractSources(
  content: string
): Array<{ title: string; url: string; type: "guichet" | "official" | "other" }> {
  const sources: Array<{ title: string; url: string; type: "guichet" | "official" | "other" }> = [];

  // Match URLs in the content
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  const matches = content.match(urlRegex) || [];

  for (const url of matches) {
    const type = url.includes("guichet.lu") ? "guichet" : "official";
    // Extract title from surrounding text (simplified)
    const title = extractTitleFromUrl(url);
    sources.push({ title, url, type });
  }

  return sources;
}

/**
 * Extract a readable title from a URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const parts = path.split("/").filter((p) => p);
    const lastPart = parts[parts.length - 1] || urlObj.hostname;
    return lastPart.replace(/[-_]/g, " ").replace(/\//g, " ");
  } catch {
    return url;
  }
}

/**
 * Search for relevant Guichet.lu content
 * This is a placeholder - in production, integrate with actual search API
 */
export async function searchGuichetContent(
  query: string,
  language: Language = "en"
): Promise<string> {
  // Placeholder: In production, this would call Guichet.lu API or search service
  // For now, return a formatted message indicating what would be searched
  return `Searching Guichet.lu for: ${query} (${language})`;
}
