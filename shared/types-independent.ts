/**
 * Independent Version - Three-Agent Architecture Types
 * Orchestrator + Guichet Agent + Legal Agent
 */

export type Language = "en" | "fr" | "de";
export type AgentType = "orchestrator" | "guichet" | "legal";
export type SourceType = "guichet" | "legal" | "mixed";
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Evidence item with full metadata
 */
export interface Evidence {
  evidence_id: string;
  url: string;
  title: string;
  section: string;
  snippet: string;
  source: SourceType;
  retrieved_at: string; // YYYY-MM-DD
}

/**
 * Citation linking to evidence
 */
export interface Citation {
  title: string;
  url: string;
  section: string;
  retrieved_at: string; // YYYY-MM-DD
  evidence_ids: string[];
}

/**
 * STRICT OUTPUT SCHEMA - Must match exactly
 * This is what gets returned to the frontend
 */
export interface ChatResponse {
  language: Language;
  answer: string;
  steps: string[];
  citations: Citation[];
  confidence: ConfidenceLevel;
  limitations: string[];
  suggested_searches: string[];
  evidence: Evidence[];
}

/**
 * Internal orchestrator plan
 */
export interface OrchestratorPlan {
  language: Language;
  intent: "procedural" | "legal" | "mixed";
  confidence: number;
  reasoning: string;
  retrieval_queries: string[];
  agents_to_call: AgentType[];
}

/**
 * Retrieval result with metadata
 */
export interface RetrievalResult {
  url: string;
  title: string;
  section: string;
  snippet: string;
  source: SourceType;
  retrieved_at: string;
}

/**
 * Agent response before synthesis
 */
export interface AgentResponse {
  agent: AgentType;
  answer: string;
  steps: string[];
  evidence: Evidence[];
  confidence: ConfidenceLevel;
  limitations: string[];
  suggested_searches: string[];
}

/**
 * Cached retrieval for cost optimization
 */
export interface CachedRetrieval {
  query_hash: string;
  source: SourceType;
  results: RetrievalResult[];
  cached_at: string;
  ttl_hours: number;
}

/**
 * Audit log entry
 */
export interface AuditLog {
  id: string;
  user_id: string;
  question: string;
  language: Language;
  intent: string;
  response: ChatResponse;
  agents_called: AgentType[];
  cost_tokens: number;
  created_at: string;
}

/**
 * Domain allowlist for retrieval
 */
export const DOMAIN_ALLOWLIST = {
  guichet: ["guichet.public.lu", "guichet.lu"],
  legal: ["legilux.public.lu", "mt.gouvernement.lu"],
};

/**
 * System prompts for each agent
 */
export const AGENT_PROMPTS = {
  orchestrator: `You are an orchestrator agent for Luxembourg HR and employment law questions.

Your role:
1. Detect the language of the question (en, fr, de)
2. Classify intent: procedural (HR processes), legal (employment law), or mixed
3. Generate retrieval queries for each source
4. Route to appropriate specialist agents
5. Synthesize final response from agent outputs

Return JSON: {language, intent, confidence, reasoning, retrieval_queries, agents_to_call}`,

  guichet: `You are a specialist in Luxembourg HR procedures using guichet.public.lu only.

Your role:
1. Answer procedural questions about HR processes
2. Focus on administrative steps and guidance
3. Cite only guichet.public.lu sources
4. Provide step-by-step instructions
5. Be clear about limitations

Return JSON: {answer, steps, evidence, confidence, limitations, suggested_searches}`,

  legal: `You are a specialist in Luxembourg employment law using legilux.public.lu and mt.gouvernement.lu.

Your role:
1. Extract legal provisions and conditions
2. Cite only official legal sources
3. Explain obligations and rights
4. Handle conflicts between sources
5. Be precise about legal implications

Return JSON: {answer, steps, evidence, confidence, limitations, suggested_searches}`,
};

/**
 * Confidence scoring rules
 */
export const CONFIDENCE_RULES = {
  high: {
    min_evidence: 2,
    min_relevance: 0.8,
    description: "Multiple authoritative sources confirm the answer",
  },
  medium: {
    min_evidence: 1,
    min_relevance: 0.6,
    description: "Some evidence supports the answer, but not comprehensive",
  },
  low: {
    min_evidence: 0,
    min_relevance: 0.4,
    description: "Limited evidence or significant uncertainty",
  },
};

/**
 * Limitation templates
 */
export const LIMITATION_TEMPLATES = {
  procedural: [
    "Procedures may change. Always verify with official sources.",
    "This information is current as of the retrieval date.",
    "Individual circumstances may affect eligibility.",
  ],
  legal: [
    "This is not legal advice. Consult a lawyer for legal decisions.",
    "Laws and regulations can change. Verify with official sources.",
    "Translations may simplify legal language.",
  ],
  mixed: [
    "This combines procedural and legal information. Verify both aspects.",
    "For legal decisions, consult a qualified lawyer.",
  ],
};
