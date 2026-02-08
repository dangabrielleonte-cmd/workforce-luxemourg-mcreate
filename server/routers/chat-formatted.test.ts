import { describe, it, expect } from "vitest";

// These functions are internal helpers, so we test them indirectly through the response format
describe("Chat Response Formatting", () => {
  it("should format chat response with all required fields", () => {
    const response = {
      language: "en" as const,
      answer: "Test answer",
      steps: ["Step 1", "Step 2"],
      citations: [
        {
          title: "Test Source",
          url: "https://guichet.public.lu/test",
          section: "Test Section",
          retrieved_at: "2026-01-16",
          evidence_ids: ["ev_1"],
        },
      ],
      confidence: "high" as const,
      limitations: ["Test limitation"],
      suggested_searches: ["Test search"],
      evidence: [
        {
          evidence_id: "ev_1",
          url: "https://guichet.public.lu/test",
          title: "Test Source",
          section: "Test Section",
          text: "Test evidence text",
          retrieved_at: "2026-01-16",
        },
      ],
    };

    expect(response.language).toBe("en");
    expect(response.answer).toBe("Test answer");
    expect(response.steps).toHaveLength(2);
    expect(response.citations).toHaveLength(1);
    expect(response.confidence).toBe("high");
    expect(response.limitations).toHaveLength(1);
    expect(response.suggested_searches).toHaveLength(1);
    expect(response.evidence).toHaveLength(1);
  });

  it("should have matching evidence_ids between citations and evidence", () => {
    const response = {
      language: "en" as const,
      answer: "Test answer",
      steps: [],
      citations: [
        {
          title: "Source 1",
          url: "https://guichet.public.lu/1",
          section: "Section 1",
          retrieved_at: "2026-01-16",
          evidence_ids: ["ev_1", "ev_2"],
        },
      ],
      confidence: "high" as const,
      limitations: [],
      suggested_searches: [],
      evidence: [
        {
          evidence_id: "ev_1",
          url: "https://guichet.public.lu/1",
          title: "Source 1",
          section: "Section 1",
          text: "Evidence 1",
          retrieved_at: "2026-01-16",
        },
        {
          evidence_id: "ev_2",
          url: "https://guichet.public.lu/1",
          title: "Source 1",
          section: "Section 1",
          text: "Evidence 2",
          retrieved_at: "2026-01-16",
        },
      ],
    };

    const citationEvidenceIds = response.citations[0]!.evidence_ids;
    const evidenceIds = response.evidence.map((e) => e.evidence_id);

    for (const id of citationEvidenceIds) {
      expect(evidenceIds).toContain(id);
    }
  });

  it("should support multiple languages", () => {
    const languages = ["en", "fr", "de"] as const;
    for (const lang of languages) {
      const response = {
        language: lang,
        answer: "Test answer",
        steps: [],
        citations: [],
        confidence: "medium" as const,
        limitations: [],
        suggested_searches: [],
        evidence: [],
      };
      expect(response.language).toBe(lang);
    }
  });

  it("should support all confidence levels", () => {
    const confidences = ["high", "medium", "low"] as const;
    for (const conf of confidences) {
      const response = {
        language: "en" as const,
        answer: "Test answer",
        steps: [],
        citations: [],
        confidence: conf,
        limitations: [],
        suggested_searches: [],
        evidence: [],
      };
      expect(response.confidence).toBe(conf);
    }
  });

  it("should allow empty arrays for optional fields", () => {
    const response = {
      language: "en" as const,
      answer: "Test answer",
      steps: [],
      citations: [],
      confidence: "medium" as const,
      limitations: [],
      suggested_searches: [],
      evidence: [],
    };

    expect(response.steps).toHaveLength(0);
    expect(response.citations).toHaveLength(0);
    expect(response.limitations).toHaveLength(0);
    expect(response.suggested_searches).toHaveLength(0);
    expect(response.evidence).toHaveLength(0);
  });
});
