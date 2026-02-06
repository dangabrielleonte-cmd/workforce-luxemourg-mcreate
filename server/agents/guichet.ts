/**
 * Guichet Agent - Specialist for HR procedures
 * Uses guichet.public.lu only
 */

import { callDeepSeek } from "../llm/deepseek";
import type { Evidence, AgentResponse } from "@shared/types-independent";

export async function processGuichetQuery(
  question: string,
  language: string,
  evidence: Evidence[]
): Promise<AgentResponse> {
  const systemPrompt = `You are a specialist in Luxembourg HR procedures using guichet.public.lu only.

Your role:
1. Answer procedural questions about HR processes
2. Focus on administrative steps and guidance
3. Cite only guichet.public.lu sources
4. Provide step-by-step instructions
5. Be clear about limitations

Evidence provided:
${evidence.map((e) => `- ${e.title} (${e.section}): ${e.snippet}`).join("\n")}

Return JSON with:
- answer: clear procedural answer
- steps: array of step-by-step instructions
- evidence: array of evidence items used
- confidence: "high", "medium", or "low"
- limitations: array of limitations
- suggested_searches: array of follow-up searches`;

  try {
    const response = await callDeepSeek({
      messages: [
        { role: "system" as const, content: systemPrompt },
        {
          role: "user" as const,
          content: question,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(response);

    return {
      agent: "guichet",
      answer: parsed.answer || "",
      steps: parsed.steps || [],
      evidence: evidence,
      confidence: (parsed.confidence || "medium") as "high" | "medium" | "low",
      limitations: parsed.limitations || [
        "This information is from guichet.public.lu and current as of retrieval date.",
        "Individual circumstances may affect eligibility.",
      ],
      suggested_searches: parsed.suggested_searches || [],
    };
  } catch (error) {
    console.error("Guichet agent error:", error);
    return {
      agent: "guichet",
      answer: "Unable to process your question with available procedural information.",
      steps: [],
      evidence: evidence,
      confidence: "low",
      limitations: ["Error processing Guichet sources."],
      suggested_searches: [],
    };
  }
}

/**
 * Validate that evidence is from Guichet domain only
 */
export function validateGuichetEvidence(evidence: Evidence[]): boolean {
  const guichetDomains = ["guichet.public.lu", "guichet.lu"];
  return evidence.every((e) =>
    guichetDomains.some((domain) => e.url.includes(domain))
  );
}
