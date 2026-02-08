/**
 * Knowledge Base Management
 * Stores and retrieves Guichet.lu content for chat responses
 */

import { getDb } from "./db";
import type { GuichetContent } from "./scrapers/guichet";

// In-memory cache for knowledge base (will be persisted to DB)
let knowledgeBaseCache: GuichetContent[] = [];
let lastUpdated: Date | null = null;

/**
 * Initialize knowledge base from database
 */
export async function initializeKnowledgeBase(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("Database not available for knowledge base initialization");
      return;
    }

    // For now, we'll use in-memory storage
    // In production, you'd query from a knowledge_base table
    console.log("Knowledge base initialized");
    lastUpdated = new Date();
  } catch (error) {
    console.error("Failed to initialize knowledge base:", error);
  }
}

/**
 * Add content to knowledge base
 */
export function addToKnowledgeBase(contents: GuichetContent[]): void {
  knowledgeBaseCache.push(...contents);
  lastUpdated = new Date();
  console.log(`Added ${contents.length} items to knowledge base`);
}

/**
 * Search knowledge base for relevant content
 */
export function searchKnowledgeBase(
  query: string,
  limit: number = 5
): GuichetContent[] {
  if (knowledgeBaseCache.length === 0) {
    return [];
  }

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  // Score each content based on keyword matches
  const scored = knowledgeBaseCache.map((content) => {
    let score = 0;

    // Check title matches (higher weight)
    keywords.forEach((keyword) => {
      if (content.title.toLowerCase().includes(keyword)) {
        score += 5;
      }
    });

    // Check section matches
    keywords.forEach((keyword) => {
      if (content.section.toLowerCase().includes(keyword)) {
        score += 3;
      }
    });

    // Check content matches
    keywords.forEach((keyword) => {
      const matches = (content.content.match(new RegExp(keyword, "gi")) || [])
        .length;
      score += Math.min(matches, 5); // Cap at 5 to avoid domination
    });

    return { content, score };
  });

  // Sort by score and return top results
  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.content);
}

/**
 * Extract relevant excerpts from content
 */
export function extractExcerpts(
  content: GuichetContent,
  query: string,
  maxExcerpts: number = 2
): string[] {
  const queryLower = query.toLowerCase();
  const sentences = content.content.split(/[.!?]+/).map((s) => s.trim());
  const excerpts: string[] = [];

  // Find sentences containing query terms
  sentences.forEach((sentence) => {
    if (sentence.length > 20 && excerpts.length < maxExcerpts) {
      const words = sentence.split(/\s+/);
      const queryWords = queryLower.split(/\s+/);

      // Check if sentence contains any query words
      const hasQueryWord = queryWords.some((qw) =>
        words.some((w) => w.toLowerCase().includes(qw))
      );

      if (hasQueryWord) {
        excerpts.push(sentence);
      }
    }
  });

  // If no relevant excerpts found, return first few sentences
  if (excerpts.length === 0) {
    return sentences.slice(0, maxExcerpts).filter((s) => s.length > 20);
  }

  return excerpts;
}

/**
 * Get knowledge base statistics
 */
export function getKnowledgeBaseStats(): {
  totalItems: number;
  lastUpdated: Date | null;
  categories: string[];
  languages: string[];
} {
  const categories = Array.from(new Set(knowledgeBaseCache.map((c) => c.category)));
  const languages = Array.from(new Set(knowledgeBaseCache.map((c) => c.language)));

  return {
    totalItems: knowledgeBaseCache.length,
    lastUpdated,
    categories: categories as string[],
    languages: languages as string[],
  };
}

/**
 * Clear knowledge base (for testing)
 */
export function clearKnowledgeBase(): void {
  knowledgeBaseCache = [];
  lastUpdated = null;
}

/**
 * Get all knowledge base content (for debugging)
 */
export function getAllKnowledgeBase(): GuichetContent[] {
  return [...knowledgeBaseCache];
}
