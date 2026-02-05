/**
 * Integrations router for Workforce Luxembourg
 * Handles embedded widget configuration and management
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createIntegration,
  getIntegrationAnalytics,
  getIntegrationBySiteKey,
  getUserIntegrations,
} from "../db";
import { nanoid } from "nanoid";
import type { IntegrationConfig } from "@shared/types";

export const integrationsRouter = router({
  /**
   * Create a new integration
   */
  createIntegration: protectedProcedure
    .input(
      z.object({
        siteName: z.string().min(1).max(255),
        config: z
          .object({
            primaryColor: z.string().optional(),
            logo: z.string().optional(),
            defaultLanguage: z.enum(["en", "fr", "de"]).optional(),
            defaultMode: z.enum(["procedural", "legal", "ai_innovation"]).optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const siteKey = `wl_${nanoid(24)}`;

      const integration = await createIntegration({
        ownerUserId: ctx.user.id,
        siteName: input.siteName,
        siteKey,
        config: input.config ? JSON.stringify(input.config) : null,
      });

      return {
        ...integration,
        config: input.config || {},
      };
    }),

  /**
   * Get all integrations for the current user
   */
  listIntegrations: protectedProcedure.query(async ({ ctx }) => {
    const integrations = await getUserIntegrations(ctx.user.id);

    return integrations.map((i) => ({
      ...i,
      config: i.config ? JSON.parse(i.config) : {},
    }));
  }),

  /**
   * Get a specific integration
   */
  getIntegration: protectedProcedure
    .input(z.object({ siteKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const integration = await getIntegrationBySiteKey(input.siteKey);

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      if (integration.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this integration",
        });
      }

      return {
        ...integration,
        config: integration.config ? JSON.parse(integration.config) : {},
      };
    }),

  /**
   * Get analytics for an integration
   */
  getAnalytics: protectedProcedure
    .input(z.object({ siteKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const integration = await getIntegrationBySiteKey(input.siteKey);

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      if (integration.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this integration",
        });
      }

      const analytics = await getIntegrationAnalytics(integration.id);
      return analytics;
    }),

  /**
   * Generate embed code snippet
   */
  generateEmbedCode: protectedProcedure
    .input(
      z.object({
        siteKey: z.string(),
        embedType: z.enum(["iframe", "script"]).default("iframe"),
      })
    )
    .query(async ({ ctx, input }) => {
      const integration = await getIntegrationBySiteKey(input.siteKey);

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      if (integration.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this integration",
        });
      }

      const baseUrl = process.env.VITE_FRONTEND_URL || "https://workforce-luxembourg.manus.space";

      if (input.embedType === "iframe") {
        const iframeCode = `<iframe
  src="${baseUrl}/embed?siteKey=${input.siteKey}"
  width="100%"
  height="600"
  frameborder="0"
  allow="clipboard-write"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
></iframe>`;

        return {
          type: "iframe",
          code: iframeCode,
          description: "Copy and paste this code into your website HTML",
        };
      } else {
        const scriptCode = `<script>
  (function() {
    const script = document.createElement('script');
    script.src = '${baseUrl}/embed.js';
    script.setAttribute('data-site-key', '${input.siteKey}');
    script.async = true;
    document.head.appendChild(script);
  })();
</script>`;

        return {
          type: "script",
          code: scriptCode,
          description: "Copy and paste this code into your website HTML (before closing </body> tag)",
        };
      }
    }),

  /**
   * Update integration configuration
   */
  updateConfig: protectedProcedure
    .input(
      z.object({
        siteKey: z.string(),
        config: z.object({
          primaryColor: z.string().optional(),
          logo: z.string().optional(),
          defaultLanguage: z.enum(["en", "fr", "de"]).optional(),
          defaultMode: z.enum(["procedural", "legal", "ai_innovation"]).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const integration = await getIntegrationBySiteKey(input.siteKey);

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      if (integration.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this integration",
        });
      }

      // In production, implement actual update in db
      return {
        ...integration,
        config: input.config,
      };
    }),

  /**
   * Delete an integration
   */
  deleteIntegration: protectedProcedure
    .input(z.object({ siteKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const integration = await getIntegrationBySiteKey(input.siteKey);

      if (!integration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Integration not found",
        });
      }

      if (integration.ownerUserId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this integration",
        });
      }

      // In production, implement actual deletion in db
      return { success: true };
    }),
});
