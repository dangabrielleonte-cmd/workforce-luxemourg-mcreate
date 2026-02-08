/**
 * Exact response format specification for all chat responses
 * This ensures all answers are returned in a consistent, business-testable format
 */

export type Language = "en" | "fr" | "de";
export type Confidence = "high" | "medium" | "low";

export interface Citation {
  title: string;
  url: string;
  section: string;
  retrieved_at: string; // ISO date format
  evidence_ids: string[];
}

export interface Evidence {
  evidence_id: string;
  url: string;
  title: string;
  section: string;
  text: string;
  retrieved_at: string; // ISO date format
}

export interface ChatResponse {
  language: Language;
  answer: string;
  steps: string[];
  citations: Citation[];
  confidence: Confidence;
  limitations: string[];
  suggested_searches: string[];
  evidence: Evidence[];
}

/**
 * Helper function to create a ChatResponse object
 */
export function createChatResponse(
  language: Language,
  answer: string,
  options: {
    steps?: string[];
    citations?: Citation[];
    confidence?: Confidence;
    limitations?: string[];
    suggested_searches?: string[];
    evidence?: Evidence[];
  } = {}
): ChatResponse {
  return {
    language,
    answer,
    steps: options.steps ?? [],
    citations: options.citations ?? [],
    confidence: options.confidence ?? "medium",
    limitations: options.limitations ?? [],
    suggested_searches: options.suggested_searches ?? [],
    evidence: options.evidence ?? [],
  };
}

/**
 * Convert a message with sources into the ChatResponse format
 */
export function formatChatResponse(
  language: Language,
  messageContent: string,
  sources: Array<{
    title: string;
    url: string;
    section?: string;
    content?: string;
  }>,
  options: {
    steps?: string[];
    confidence?: Confidence;
    limitations?: string[];
    suggested_searches?: string[];
  } = {}
): ChatResponse {
  const evidence: Evidence[] = sources.map((source, index) => ({
    evidence_id: `ev_${index + 1}`,
    url: source.url,
    title: source.title,
    section: source.section ?? "General",
    text: source.content ?? "",
    retrieved_at: new Date().toISOString(),
  }));

  const citations: Citation[] = sources.map((source, index) => ({
    title: source.title,
    url: source.url,
    section: source.section ?? "General",
    retrieved_at: new Date().toISOString().split("T")[0] ?? new Date().toISOString(),
    evidence_ids: [`ev_${index + 1}`],
  }));

  return createChatResponse(language, messageContent, {
    steps: options.steps,
    citations,
    confidence: options.confidence ?? "medium",
    limitations: options.limitations,
    suggested_searches: options.suggested_searches,
    evidence,
  });
}
