/**
 * Retrieval Layer - Fetches evidence from authorized sources
 * Supports caching and domain allowlisting
 */

import type { RetrievalResult, Evidence } from "@shared/types-independent";

/**
 * Domain allowlist - only these domains are used
 */
const DOMAIN_ALLOWLIST = {
  guichet: ["guichet.public.lu"],
  legal: ["legilux.public.lu", "mt.gouvernement.lu"],
};

/**
 * Cache for retrieval results (in-memory, production should use Redis)
 */
const retrievalCache = new Map<string, { results: RetrievalResult[]; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate cache key from query
 */
function getCacheKey(query: string, source: "guichet" | "legal"): string {
  return `${source}:${query.toLowerCase().replace(/\s+/g, "_")}`;
}

/**
 * Check cache for existing results
 */
function getCachedResults(query: string, source: "guichet" | "legal"): RetrievalResult[] | null {
  const key = getCacheKey(query, source);
  const cached = retrievalCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Retrieval] Cache hit for ${key}`);
    return cached.results;
  }

  if (cached) {
    retrievalCache.delete(key);
  }
  return null;
}

/**
 * Store results in cache
 */
function cacheResults(query: string, source: "guichet" | "legal", results: RetrievalResult[]): void {
  const key = getCacheKey(query, source);
  retrievalCache.set(key, { results, timestamp: Date.now() });
}

/**
 * Retrieve evidence from Guichet sources
 * In production, this would call a real search API or web scraper
 */
export async function retrieveGuichetEvidence(
  queries: string[],
  language: string
): Promise<Evidence[]> {
  const evidence: Evidence[] = [];

  for (const query of queries) {
    // Check cache first
    const cached = getCachedResults(query, "guichet");
    if (cached) {
      evidence.push(
        ...cached.map((r) => ({
          evidence_id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          url: r.url,
          title: r.title,
          section: r.section,
          snippet: r.snippet,
          source: "guichet" as const,
          retrieved_at: new Date().toISOString().split("T")[0],
        }))
      );
      continue;
    }

    // In production, call real retrieval API
    // For now, return mock data
    const mockResults = getMockGuichetResults(query, language);
    cacheResults(query, "guichet", mockResults);

    evidence.push(
      ...mockResults.map((r) => ({
        evidence_id: `ev_${Math.random().toString(36).substr(2, 9)}`,
        url: r.url,
        title: r.title,
        section: r.section,
        snippet: r.snippet,
        source: "guichet" as const,
        retrieved_at: new Date().toISOString().split("T")[0],
      }))
    );
  }

  return evidence;
}

/**
 * Retrieve evidence from Legal sources
 */
export async function retrieveLegalEvidence(
  queries: string[],
  language: string
): Promise<Evidence[]> {
  const evidence: Evidence[] = [];

  for (const query of queries) {
    // Check cache first
    const cached = getCachedResults(query, "legal");
    if (cached) {
      evidence.push(
        ...cached.map((r) => ({
          evidence_id: `ev_${Math.random().toString(36).substr(2, 9)}`,
          url: r.url,
          title: r.title,
          section: r.section,
          snippet: r.snippet,
          source: "legal" as const,
          retrieved_at: new Date().toISOString().split("T")[0],
        }))
      );
      continue;
    }

    // In production, call real retrieval API
    // For now, return mock data
    const mockResults = getMockLegalResults(query, language);
    cacheResults(query, "legal", mockResults);

    evidence.push(
      ...mockResults.map((r) => ({
        evidence_id: `ev_${Math.random().toString(36).substr(2, 9)}`,
        url: r.url,
        title: r.title,
        section: r.section,
        snippet: r.snippet,
        source: "legal" as const,
        retrieved_at: new Date().toISOString().split("T")[0],
      }))
    );
  }

  return evidence;
}

/**
 * Mock data for Guichet (replace with real API)
 */
function getMockGuichetResults(query: string, language: string): RetrievalResult[] {
  return [
    {
      url: "https://guichet.public.lu/en/citoyens/emploi-travail/contrat-travail",
      title: "Employment Contract",
      section: "Rights and Obligations",
      snippet:
        "An employment contract must be in writing and contain the essential terms of employment including salary, working hours, and duration.",
      source: "guichet",
      retrieved_at: new Date().toISOString().split("T")[0],
    },
  ];
}

/**
 * Mock data for Legal (replace with real API)
 */
function getMockLegalResults(query: string, language: string): RetrievalResult[] {
  return [
    {
      url: "https://legilux.public.lu/eli/etat/leg/loi/2018/05/08/a710",
      title: "Labour Code - Article 1",
      section: "General Provisions",
      snippet:
        "Every worker has the right to a written employment contract specifying the terms and conditions of employment.",
      source: "legal",
      retrieved_at: new Date().toISOString().split("T")[0],
    },
  ];
}

/**
 * Validate that evidence comes from allowed domains
 */
export function validateEvidenceDomains(evidence: Evidence[]): boolean {
  return evidence.every((e) => {
    const guichetOk = e.source === "guichet" &&
      DOMAIN_ALLOWLIST.guichet.some((domain) => e.url.includes(domain));
    const legalOk = e.source === "legal" &&
      DOMAIN_ALLOWLIST.legal.some((domain) => e.url.includes(domain));
    return guichetOk || legalOk;
  });
}

/**
 * Clear cache (for testing)
 */
export function clearCache(): void {
  retrievalCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: retrievalCache.size,
    entries: Array.from(retrievalCache.keys()),
  };
}
