import { publicProcedure, router } from "../_core/trpc";

/**
 * Debug router for troubleshooting authentication issues
 * These endpoints help diagnose session and cookie problems
 */
export const debugRouter = router({
  /**
   * Get current session status
   * Returns user info if authenticated, or null if not
   */
  sessionStatus: publicProcedure.query(({ ctx }) => {
    return {
      isAuthenticated: !!ctx.user,
      user: ctx.user ? {
        id: ctx.user.id,
        openId: ctx.user.openId,
        email: ctx.user.email,
        name: ctx.user.name,
        role: ctx.user.role,
      } : null,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get request headers for debugging
   * Shows what headers the server is receiving
   */
  headers: publicProcedure.query(({ ctx }) => {
    const req = ctx.req;
    return {
      protocol: req.protocol,
      hostname: req.hostname,
      url: req.url,
      method: req.method,
      headers: {
        cookie: req.headers.cookie ? "[REDACTED]" : "none",
        "user-agent": req.headers["user-agent"],
        "x-forwarded-proto": req.headers["x-forwarded-proto"],
        "x-forwarded-for": req.headers["x-forwarded-for"],
        origin: req.headers.origin,
        referer: req.headers.referer,
      },
    };
  }),

  /**
   * Verify session token
   * Attempts to verify the session cookie
   */
  verifySession: publicProcedure.query(async ({ ctx }) => {
    const req = ctx.req;
    const cookieHeader = req.headers.cookie;
    
    if (!cookieHeader) {
      return {
        hasCookie: false,
        message: "No cookies found in request",
      };
    }

    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    const sessionCookie = cookies["manus-session"] || cookies["session"];

    return {
      hasCookie: !!sessionCookie,
      cookieNames: Object.keys(cookies),
      sessionCookiePresent: !!sessionCookie,
      sessionCookieLength: sessionCookie?.length || 0,
      message: sessionCookie ? "Session cookie found" : "Session cookie not found",
    };
  }),
});
