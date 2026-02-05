/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";


/**
 * Application-specific types for Workforce Luxembourg
 */

export type ExpertiseMode = "procedural" | "legal" | "ai_innovation";

export type Language = "en" | "fr" | "de";

export type SourceType = "guichet" | "official" | "other";

export interface MessageSourceData {
  id: number;
  messageId: number;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: SourceType | null;
  createdAt: Date;
}

export interface ChatMessageData {
  id: number;
  conversationId: number;
  sender: "user" | "assistant" | "system";
  content: string;
  mode?: ExpertiseMode;
  sources: MessageSourceData[];
  createdAt: Date;
}

export interface ChatResponse {
  content: string;
  mode: ExpertiseMode;
  sources: MessageSourceData[];
  disclaimer: string;
}

export interface IntegrationConfig {
  primaryColor?: string;
  logo?: string;
  defaultLanguage?: Language;
  defaultMode?: ExpertiseMode;
}

export interface EmbedConfig {
  siteKey: string;
  config: IntegrationConfig;
}

export const EXPERTISE_MODES = {
  procedural: {
    label: "Procedural HR",
    description: "How-to and process flows for HR procedures",
  },
  legal: {
    label: "Employment Law",
    description: "Legal structure, obligations, and rights",
  },
  ai_innovation: {
    label: "AI & Innovation",
    description: "AI support programmes and innovation initiatives",
  },
} as const;

export const LANGUAGES = {
  en: "English",
  fr: "Francais",
  de: "Deutsch",
} as const;

export const DISCLAIMERS = {
  general:
    "This is general information based on public sources such as Guichet.lu. It is not legal or professional advice. For decisions with legal impact, consult a qualified lawyer or HR specialist.",
  legal:
    "This is general information and not legal advice. Laws and regulations can change. Translations or summaries may simplify legal language. You remain responsible for verifying crucial information. For legal decisions, consult a qualified lawyer.",
  procedural:
    "This information is based on official sources. Procedures and requirements may change. Always verify with the official sources linked below before taking action.",
};
