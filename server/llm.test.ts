import { describe, it, expect, vi } from "vitest";
import { routeQuery, extractSources } from "./llm";

// Mock the LLM invocation
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async (params: any) => {
    if (params.response_format?.json_schema?.name === "query_routing") {
      return {
        choices: [
          {
            message: {
              content: JSON.stringify({
                mode: "procedural",
                confidence: 0.95,
                reasoning: "Question asks about procedures",
              }),
            },
          },
        ],
      };
    }
    return {
      choices: [
        {
          message: {
            content: "This is a test response with a link to https://guichet.lu/test",
          },
        },
      ],
    };
  }),
}));

describe("LLM Integration", () => {
  describe("routeQuery", () => {
    it("routes procedural questions correctly", async () => {
      const result = await routeQuery("How do I register as a job-seeker?", "en");

      expect(result.mode).toBe("procedural");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
    });

    it("handles different languages", async () => {
      const result = await routeQuery("Comment m'inscrire comme demandeur d'emploi?", "fr");

      expect(result.mode).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("returns valid confidence score", async () => {
      const result = await routeQuery("What is employment law?", "en");

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("extractSources", () => {
    it("extracts URLs from content", () => {
      const content =
        "Check https://guichet.lu/test for more information and https://example.com/page";
      const sources = extractSources(content);

      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]?.url).toContain("https://");
    });

    it("identifies guichet.lu sources", () => {
      const content = "For more info, see https://guichet.lu/procedures";
      const sources = extractSources(content);

      const guichetSource = sources.find((s) => s.type === "guichet");
      expect(guichetSource).toBeDefined();
    });

    it("handles content without URLs", () => {
      const content = "This is a response without any links";
      const sources = extractSources(content);

      expect(sources).toEqual([]);
    });

    it("extracts readable titles from URLs", () => {
      const content = "Check https://guichet.lu/en/citoyens/travail/recherche-emploi";
      const sources = extractSources(content);

      expect(sources.length).toBeGreaterThan(0);
      expect(sources[0]?.title).toBeDefined();
      expect(sources[0]?.title.length).toBeGreaterThan(0);
    });
  });
});
