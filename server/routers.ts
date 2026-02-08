import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { demoRouter } from "./routers/demo";
import { chatRouter } from "./routers/chat";
import { chatFormattedRouter } from "./routers/chat-formatted";
import { integrationsRouter } from "./routers/integrations";
import { debugRouter } from "./routers/debug";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  demo: demoRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      // Clear both Manus OAuth cookie and demo session cookie
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("manus_session", { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: chatFormattedRouter,
  integrations: integrationsRouter,
  debug: debugRouter,
});

export type AppRouter = typeof appRouter;

// Export routers for use in other modules
export { chatRouter, integrationsRouter, debugRouter };
