/**
 * Legal Agent - Specialist for employment law
 * Uses legilux.public.lu and mt.gouvernement.lu only
 */

import { callDeepSeek } from "../llm/deepseek";
import type { Evidence, AgentResponse } from "@shared/types-independent";

export async function processLegalQuery(
  question: string,
  language: string,
  evidence: Evidence[]
): Promise<AgentResponse> {
  const systemPrompt = `You are a specialist in Luxembourg employment law using legilux.public.lu and mt.gouvernement.lu.

Your role:
1. Extract legal provisions and conditions
2. Cite only official legal sources
3. Explain obligations and rights
4. Handle conflicts between sources
5. Be precise about legal implications

IMPORTANT: This is not legal advice. Users must consult lawyers for decisions.

Evidence provided:
${evidence.map((e) => `- ${e.title} (${e.section}): ${e.snippet}`).join("\n")}

Return JSON with:
- answer: clear legal explanation
- steps: array of legal obligations/rights
- evidence: array of evidence items used
- confidence: "high", "medium", or "low"
- limitations: array of limitations (MUST include legal disclaimer)
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

    // Ensure legal disclaimer is included
    const limitations = parsed.limitations || [];
    if (!limitations.some((l: string) => l.toLowerCase().includes("legal advice"))) {
      limitations.unshift(
        "This is not legal advice. Consult a qualified lawyer for legal decisions."
      );
    }

    return {
      agent: "legal",
      answer: parsed.answer || "",
      steps: parsed.steps || [],
      evidence: evidence,
      confidence: (parsed.confidence || "medium") as "high" | "medium" | "low",
      limitations: limitations,
      suggested_searches: parsed.suggested_searches || [],
    };
  } catch (error) {
    console.error("Legal agent error:", error);
    return {
      agent: "legal",
      answer: "Unable to process your question with available legal information.",
      steps: [],
      evidence: evidence,
      confidence: "low",
      limitations: [
        "This is not legal advice. Consult a qualified lawyer.",
        "Error processing legal sources.",
      ],
      suggested_searches: [],
    };
  }
}

/**
 * Validate that evidence is from legal domains only
 */
export function validateLegalEvidence(evidence: Evidence[]): boolean {
  const legalDomains = ["legilux.public.lu", "mt.gouvernement.lu"];
  return evidence.every((e) =>
    legalDomains.some((domain) => e.url.includes(domain))
  );
}

/**
 * Check for conflicting legal provisions
 */
export function detectConflicts(evidence: Evidence[]): string[] {
  const conflicts: string[] = [];
  // Simple conflict detection: if multiple sources say different things
  // In production, use NLP or semantic similarity
  if (evidence.length > 1) {
    const snippets = evidence.map((e) => e.snippet.toLowerCase());
    // Check for contradictory keywords
    const contradictions = [
      ["must", "must not"],
      ["required", "optional"],
      ["mandatory", "voluntary"],
    ];
    for (const [word1, word2] of contradictions) {
      const has1 = snippets.some((s) => s.includes(word1));
      const has2 = snippets.some((s) => s.includes(word2));
      if (has1 && has2) {
        conflicts.push(
          `Potential conflict: sources mention both "${word1}" and "${word2}"`
        );
      }
    }
  }
  return conflicts;
}
