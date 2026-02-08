import { describe, it, expect, beforeEach } from "vitest";
import {
  addToKnowledgeBase,
  searchKnowledgeBase,
  extractExcerpts,
  getKnowledgeBaseStats,
  clearKnowledgeBase,
} from "./knowledge-base";
import type { GuichetContent } from "./scrapers/guichet";

describe("Knowledge Base", () => {
  beforeEach(() => {
    clearKnowledgeBase();
  });

  const mockContent: GuichetContent[] = [
    {
      id: "test-1",
      title: "Employment Contracts in Luxembourg",
      url: "https://guichet.public.lu/en/citoyens/contrat-travail.html",
      content:
        "Employment contracts in Luxembourg must comply with the Labor Code. Contracts should specify the job title, salary, working hours, and duration. Both fixed-term and indefinite contracts are permitted.",
      section: "Employment Contracts",
      category: "Employment",
      lastUpdated: new Date(),
      language: "en",
    },
    {
      id: "test-2",
      title: "Employee Rights",
      url: "https://guichet.public.lu/en/citoyens/droits-obligations-salaries.html",
      content:
        "Employees in Luxembourg have the right to fair wages, safe working conditions, and protection from discrimination. The minimum wage is set by law and adjusted annually.",
      section: "Employee Rights",
      category: "Employee Rights",
      lastUpdated: new Date(),
      language: "en",
    },
  ];

  it("should add content to knowledge base", () => {
    addToKnowledgeBase(mockContent);
    const stats = getKnowledgeBaseStats();
    expect(stats.totalItems).toBe(2);
  });

  it("should search knowledge base by keyword", () => {
    addToKnowledgeBase(mockContent);
    const results = searchKnowledgeBase("employment contracts", 5);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.title).toContain("Employment Contracts");
  });

  it("should return empty array when no matches found", () => {
    addToKnowledgeBase(mockContent);
    const results = searchKnowledgeBase("nonexistent topic", 5);
    expect(results.length).toBe(0);
  });

  it("should extract relevant excerpts from content", () => {
    const content = mockContent[0]!;
    const excerpts = extractExcerpts(content, "employment contracts", 2);
    expect(excerpts.length).toBeGreaterThan(0);
    expect(excerpts[0]).toContain("Employment contracts");
  });

  it("should return first sentences if no relevant excerpts found", () => {
    const content = mockContent[0]!;
    const excerpts = extractExcerpts(content, "xyz123", 2);
    expect(excerpts.length).toBeGreaterThan(0);
  });

  it("should get knowledge base statistics", () => {
    addToKnowledgeBase(mockContent);
    const stats = getKnowledgeBaseStats();
    expect(stats.totalItems).toBe(2);
    expect(stats.categories).toContain("Employment");
    expect(stats.languages).toContain("en");
  });

  it("should clear knowledge base", () => {
    addToKnowledgeBase(mockContent);
    clearKnowledgeBase();
    const stats = getKnowledgeBaseStats();
    expect(stats.totalItems).toBe(0);
  });

  it("should handle multiple search results with scoring", () => {
    addToKnowledgeBase(mockContent);
    const results = searchKnowledgeBase("wage salary", 5);
    // Should find content mentioning wages
    expect(results.length).toBeGreaterThan(0);
  });
});
