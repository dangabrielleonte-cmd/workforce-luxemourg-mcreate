/**
 * Guichet.lu Web Scraper
 * Fetches and indexes real HR and employment law content from Guichet.lu
 */

import * as cheerio from "cheerio";

export interface GuichetContent {
  id: string;
  title: string;
  url: string;
  content: string;
  section: string;
  category: string;
  lastUpdated: Date;
  language: "en" | "fr" | "de";
}

// Key Guichet.lu pages to scrape for HR and employment law content
const GUICHET_PAGES = [
  {
    url: "https://guichet.public.lu/en/citoyens/emploi-travail.html",
    category: "Employment",
    language: "en" as const,
  },
  {
    url: "https://guichet.public.lu/en/citoyens/droits-obligations-salaries.html",
    category: "Employee Rights",
    language: "en" as const,
  },
  {
    url: "https://guichet.public.lu/en/citoyens/contrat-travail.html",
    category: "Employment Contracts",
    language: "en" as const,
  },
  {
    url: "https://guichet.public.lu/en/citoyens/adem.html",
    category: "ADEM Services",
    language: "en" as const,
  },
  {
    url: "https://guichet.public.lu/fr/citoyens/emploi-travail.html",
    category: "Employment",
    language: "fr" as const,
  },
  {
    url: "https://guichet.public.lu/de/citoyens/emploi-travail.html",
    category: "Employment",
    language: "de" as const,
  },
];

/**
 * Fetch and parse a single Guichet.lu page
 */
export async function scrapeGuichetPage(
  url: string,
  category: string,
  language: "en" | "fr" | "de"
): Promise<GuichetContent[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const contents: GuichetContent[] = [];

    // Extract main content sections
    $("article, .content, main").each((index: number, element: any) => {
      const $element = $(element);

      // Get title
      const title =
        $element.find("h1, h2").first().text().trim() ||
        $("title").text().trim();

      // Get content paragraphs
      const paragraphs: string[] = [];
      $element.find("p, li").each((_: number, el: any) => {
        const text = $(el).text().trim();
        if (text.length > 20) {
          paragraphs.push(text);
        }
      });

      const content = paragraphs.join("\n\n");

      if (title && content && content.length > 100) {
        contents.push({
          id: `guichet-${Date.now()}-${index}`,
          title,
          url,
          content,
          section: category,
          category,
          lastUpdated: new Date(),
          language,
        });
      }
    });

    return contents;
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
}

/**
 * Scrape all key Guichet.lu pages
 */
export async function scrapeAllGuichetPages(): Promise<GuichetContent[]> {
  const allContents: GuichetContent[] = [];

  for (const page of GUICHET_PAGES) {
    console.log(`Scraping ${page.url}...`);
    const contents = await scrapeGuichetPage(
      page.url,
      page.category,
      page.language
    );
    allContents.push(...contents);

    // Be respectful - add delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return allContents;
}

/**
 * Search knowledge base for relevant content
 */
export function searchContent(
  contents: GuichetContent[],
  query: string,
  limit: number = 5
): GuichetContent[] {
  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter((w) => w.length > 2);

  // Score each content based on keyword matches
  const scored = contents.map((content) => {
    let score = 0;

    // Check title matches (higher weight)
    keywords.forEach((keyword) => {
      if (content.title.toLowerCase().includes(keyword)) {
        score += 3;
      }
    });

    // Check content matches
    keywords.forEach((keyword) => {
      const matches = (content.content.match(new RegExp(keyword, "gi")) || [])
        .length;
      score += matches;
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
  excerptLength: number = 200
): string[] {
  const queryLower = query.toLowerCase();
  const sentences = content.content.split(/[.!?]+/);
  const excerpts: string[] = [];

  sentences.forEach((sentence) => {
    if (
      sentence.toLowerCase().includes(queryLower) &&
      excerpts.length < 3
    ) {
      const excerpt = sentence.trim();
      if (excerpt.length > 20) {
        excerpts.push(excerpt);
      }
    }
  });

  return excerpts.length > 0
    ? excerpts
    : sentences.slice(0, 2).map((s) => s.trim());
}
