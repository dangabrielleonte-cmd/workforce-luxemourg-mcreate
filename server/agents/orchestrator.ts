/**
 * Orchestrator Agent - Plans retrieval and routes to specialists
 * Uses cheap model (DeepSeek) for planning
 */

import { callDeepSeek } from "../llm/deepseek";
import type { OrchestratorPlan, Language } from "@shared/types-independent";

export async function planRequest(
  question: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<OrchestratorPlan> {
  const systemPrompt = `You are an orchestrator for Luxembourg HR and employment law questions.

Analyze the question and return JSON with:
- language: "en", "fr", or "de" (detected from question)
- intent: "procedural" (HR processes), "legal" (employment law), or "mixed"
- confidence: 0-1 score of your classification
- reasoning: brief explanation
- retrieval_queries: array of 2-3 search queries for retrieval
- agents_to_call: array of "guichet" and/or "legal"

Be concise. This is a cheap planning step.`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    ...conversationHistory.map(m => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: question,
    },
  ];

  try {
    const response = await callDeepSeek({
      messages: [
        { role: "system" as const, content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response);

    return {
      language: (parsed.language || "en") as Language,
      intent: parsed.intent || "mixed",
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || "",
      retrieval_queries: parsed.retrieval_queries || [question],
      agents_to_call: parsed.agents_to_call || ["guichet", "legal"],
    };
  } catch (error) {
    console.error("Orchestrator planning failed:", error);
    // Fallback plan
    return {
      language: "en",
      intent: "mixed",
      confidence: 0.5,
      reasoning: "Fallback plan due to processing error",
      retrieval_queries: [question],
      agents_to_call: ["guichet", "legal"],
    };
  }
}

/**
 * Synthesize responses from multiple agents
 */
export async function synthesizeResponses(
  question: string,
  language: Language,
  agentResponses: Array<{
    agent: string;
    answer: string;
    steps: string[];
    evidence: any[];
    confidence: string;
    limitations: string[];
    suggested_searches: string[];
  }>
): Promise<{
  answer: string;
  steps: string[];
  confidence: "high" | "medium" | "low";
  limitations: string[];
  suggested_searches: string[];
}> {
  if (agentResponses.length === 0) {
    return {
      answer: "Unable to find relevant information to answer your question.",
      steps: [],
      confidence: "low",
      limitations: [
        "No evidence found in available sources.",
        "Please rephrase your question or contact support.",
      ],
      suggested_searches: [],
    };
  }

  if (agentResponses.length === 1) {
    // Single agent response - use directly
    const response = agentResponses[0];
    return {
      answer: response.answer,
      steps: response.steps,
      confidence: response.confidence as "high" | "medium" | "low",
      limitations: response.limitations,
      suggested_searches: response.suggested_searches,
    };
  }

  // Multiple agent responses - synthesize
  const systemPrompt = `You are synthesizing responses from multiple specialists.

Combine their answers into a coherent response that:
1. Merges procedural and legal information logically
2. Avoids redundancy
3. Maintains accuracy from each source
4. Prioritizes procedural steps first, then legal context
5. Combines limitations and suggested searches

Return JSON with: {answer, steps, confidence, limitations, suggested_searches}`;

  const agentSummary = agentResponses
    .map(
      (r) =>
        `${r.agent.toUpperCase()}: ${r.answer}\nSteps: ${r.steps.join("; ")}`
    )
    .join("\n\n");

  try {
    const response = await callDeepSeek({
      messages: [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content: `Question: ${question}\n\nAgent responses:\n${agentSummary}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response);

    return {
      answer: parsed.answer || agentResponses[0].answer,
      steps: parsed.steps || agentResponses.flatMap((r) => r.steps),
      confidence: parsed.confidence || "medium",
      limitations: parsed.limitations || agentResponses.flatMap((r) => r.limitations),
      suggested_searches: parsed.suggested_searches || agentResponses.flatMap((r) => r.suggested_searches),
    };
  } catch (error) {
    console.error("Synthesis failed:", error);
    // Fallback: combine all responses
    return {
      answer: agentResponses.map((r) => r.answer).join("\n\n"),
      steps: agentResponses.flatMap((r) => r.steps),
      confidence: "medium",
      limitations: agentResponses.flatMap((r) => r.limitations),
      suggested_searches: agentResponses.flatMap((r) => r.suggested_searches),
    };
  }
}

/**
 * Validate response against schema
 */
export function validateResponse(response: any): boolean {
  const required = ["answer", "steps", "citations", "confidence", "limitations", "suggested_searches", "evidence"];
  return required.every((field) => field in response);
}

/**
 * Downgrade confidence if insufficient evidence
 */
export function adjustConfidenceByEvidence(
  confidence: "high" | "medium" | "low",
  evidenceCount: number
): "high" | "medium" | "low" {
  if (evidenceCount === 0) return "low";
  if (evidenceCount === 1) return confidence === "high" ? "medium" : confidence;
  return confidence;
}
