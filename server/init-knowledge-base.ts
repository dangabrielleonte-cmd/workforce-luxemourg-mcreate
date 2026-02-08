/**
 * Initialize Knowledge Base
 * Loads Guichet.lu content on server startup
 */

import { scrapeAllGuichetPages } from "./scrapers/guichet";
import { addToKnowledgeBase, getKnowledgeBaseStats } from "./knowledge-base";

export async function initializeKnowledgeBase(): Promise<void> {
  console.log("[KB] Starting knowledge base initialization...");

  try {
    // Scrape Guichet.lu pages
    console.log("[KB] Scraping Guichet.lu content...");
    const content = await scrapeAllGuichetPages();

    if (content.length === 0) {
      console.warn("[KB] No content scraped from Guichet.lu. Using fallback data.");
      // Add fallback content for testing
      addToKnowledgeBase([
        {
          id: "fallback-1",
          title: "Employment Contracts in Luxembourg",
          url: "https://guichet.public.lu/en/citoyens/contrat-travail.html",
          content:
            "Employment contracts in Luxembourg must comply with the Labor Code. Contracts should specify the job title, salary, working hours, and duration. Both fixed-term and indefinite contracts are permitted. Employees have the right to a written contract.",
          section: "Employment Contracts",
          category: "Employment",
          lastUpdated: new Date(),
          language: "en",
        },
        {
          id: "fallback-2",
          title: "Employee Rights in Luxembourg",
          url: "https://guichet.public.lu/en/citoyens/droits-obligations-salaries.html",
          content:
            "Employees in Luxembourg have the right to fair wages, safe working conditions, and protection from discrimination. The minimum wage is set by law and adjusted annually. Employees are entitled to paid leave, sick leave, and maternity/paternity leave.",
          section: "Employee Rights",
          category: "Employee Rights",
          lastUpdated: new Date(),
          language: "en",
        },
        {
          id: "fallback-3",
          title: "ADEM - Employment Services",
          url: "https://guichet.public.lu/en/citoyens/adem.html",
          content:
            "ADEM (Agence pour le Développement de l'Emploi) is Luxembourg's employment agency. It provides job placement services, training programs, and support for job seekers. ADEM also manages unemployment benefits and helps employers find qualified candidates.",
          section: "ADEM Services",
          category: "Employment",
          lastUpdated: new Date(),
          language: "en",
        },
      ]);
    } else {
      // Add scraped content to knowledge base
      addToKnowledgeBase(content);
    }

    // Log statistics
    const stats = getKnowledgeBaseStats();
    console.log("[KB] Knowledge base initialized successfully!");
    console.log(`[KB] Total items: ${stats.totalItems}`);
    console.log(`[KB] Categories: ${stats.categories.join(", ")}`);
    console.log(`[KB] Languages: ${stats.languages.join(", ")}`);
  } catch (error) {
    console.error("[KB] Failed to initialize knowledge base:", error);
    // Continue with empty knowledge base rather than crashing
  }
}
