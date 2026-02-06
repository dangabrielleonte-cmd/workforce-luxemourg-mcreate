/**
 * Independent Chat Procedure
 * Orchestrates the three-agent system with exact output schema
 */

import { planRequest, synthesizeResponses, validateResponse } from "../agents/orchestrator";
import { processGuichetQuery, validateGuichetEvidence } from "../agents/guichet";
import { processLegalQuery, validateLegalEvidence, detectConflicts } from "../agents/legal";
import { retrieveGuichetEvidence, retrieveLegalEvidence, validateEvidenceDomains } from "../retrieval/index";
import type { ChatResponse, Language, Citation, Evidence } from "@shared/types-independent";

/**
 * Main chat procedure - returns strict JSON schema
 */
export async function processQuestion(
  question: string,
  language?: Language,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ChatResponse> {
  console.log(`[Chat] Processing: ${question}`);

  try {
    // Step 1: Orchestrator analyzes and plans
    const plan = await planRequest(question, conversationHistory);
    console.log(`[Chat] Plan: intent=${plan.intent}, agents=${plan.agents_to_call.join(",")}`);

    // Step 2: Retrieve evidence based on plan
    const guichetEvidence =
      plan.agents_to_call.includes("guichet") && plan.retrieval_queries.length > 0
        ? await retrieveGuichetEvidence(plan.retrieval_queries, plan.language)
        : [];

    const legalEvidence =
      plan.agents_to_call.includes("legal") && plan.retrieval_queries.length > 0
        ? await retrieveLegalEvidence(plan.retrieval_queries, plan.language)
        : [];

    // Validate evidence domains
    if (!validateEvidenceDomains([...guichetEvidence, ...legalEvidence])) {
      console.warn("[Chat] Evidence validation failed - domain mismatch");
    }

    // Step 3: Call specialist agents
    const agentResponses = [];

    if (plan.agents_to_call.includes("guichet") && guichetEvidence.length > 0) {
      const guichetResponse = await processGuichetQuery(question, plan.language, guichetEvidence);
      agentResponses.push(guichetResponse);
    }

    if (plan.agents_to_call.includes("legal") && legalEvidence.length > 0) {
      const legalResponse = await processLegalQuery(question, plan.language, legalEvidence);
      agentResponses.push(legalResponse);
    }

    // Step 4: Synthesize responses
    const synthesized = await synthesizeResponses(question, plan.language, agentResponses);

    // Step 5: Build citations from evidence
    const allEvidence = [...guichetEvidence, ...legalEvidence];
    const citations = buildCitations(allEvidence);

    // Step 6: Check for conflicts
    const conflicts = detectConflicts(legalEvidence);
    if (conflicts.length > 0) {
      synthesized.limitations.push(...conflicts);
    }

    // Step 7: Build final response
    const response: ChatResponse = {
      language: plan.language,
      answer: synthesized.answer,
      steps: synthesized.steps,
      citations: citations,
      confidence: synthesized.confidence,
      limitations: synthesized.limitations,
      suggested_searches: synthesized.suggested_searches,
      evidence: allEvidence,
    };

    // Step 8: Validate response schema
    if (!validateResponse(response)) {
      console.warn("[Chat] Response validation failed - schema mismatch");
    }

    console.log(`[Chat] Success: ${response.citations.length} citations, confidence=${response.confidence}`);
    return response;
  } catch (error) {
    console.error("[Chat] Error:", error);
    return buildErrorResponse(question, language);
  }
}

/**
 * Build citations from evidence
 */
function buildCitations(evidence: Evidence[]): Citation[] {
  const citationMap = new Map<string, Citation>();

  for (const ev of evidence) {
    const key = `${ev.url}|${ev.section}`;

    if (citationMap.has(key)) {
      const existing = citationMap.get(key)!;
      existing.evidence_ids.push(ev.evidence_id);
    } else {
      citationMap.set(key, {
        title: ev.title,
        url: ev.url,
        section: ev.section,
        retrieved_at: ev.retrieved_at,
        evidence_ids: [ev.evidence_id],
      });
    }
  }

  return Array.from(citationMap.values());
}

/**
 * Build error response with proper schema
 */
function buildErrorResponse(question: string, language?: Language): ChatResponse {
  return {
    language: language || "en",
    answer: "I was unable to process your question. Please try rephrasing or contact support.",
    steps: [],
    citations: [],
    confidence: "low",
    limitations: [
      "An error occurred while processing your question.",
      "Please try again or contact support.",
    ],
    suggested_searches: [],
    evidence: [],
  };
}

/**
 * Batch process multiple questions
 */
export async function processQuestions(
  questions: string[],
  language?: Language
): Promise<ChatResponse[]> {
  return Promise.all(questions.map((q) => processQuestion(q, language)));
}
