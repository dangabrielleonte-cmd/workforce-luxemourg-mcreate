/**
 * Demo login router for testing without Manus OAuth
 * Provides simple username/password authentication for demo purposes
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb, upsertUser } from "../db";

// Demo credentials - use these to test the app
const DEMO_CREDENTIALS = {
  username: "demo@testing11.com",
  password: "Testingit11!",
  email: "demo@testing11.com",
};

// Demo user ID (fixed for consistent sessions)
const DEMO_USER_ID = 999999;

export const demoRouter = router({
  /**
   * Demo login - returns a session token
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify credentials (support both email and username)
      const isValidUsername = input.username === DEMO_CREDENTIALS.username;
      const isValidPassword = input.password === DEMO_CREDENTIALS.password;
      
      if (!isValidUsername || !isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Create or update demo user in database
      const demoOpenId = `demo-user-${DEMO_USER_ID}`;
      await upsertUser({
        openId: demoOpenId,
        name: "Demo Tester",
        email: DEMO_CREDENTIALS.email,
        loginMethod: "demo",
        role: "user",
        lastSignedIn: new Date(),
      });

      // Get the user from database
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { eq } = await import("drizzle-orm");
      const { users } = await import("../../drizzle/schema");

      const result = await db
        .select()
        .from(users)
        .where(eq(users.openId, demoOpenId))
        .limit(1);

      if (!result.length) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create demo user",
        });
      }

      const user = result[0];

      // Set session cookie (same as OAuth callback)
      const { getSessionCookieOptions } = await import("../_core/cookies");
      const { createSessionToken } = await import("../_core/session");

      const cookieOptions = getSessionCookieOptions(ctx.req);
      const sessionToken = createSessionToken(user.id, user.openId);

      ctx.res.setHeader(
        "Set-Cookie",
        `manus_session=${sessionToken}; Path=/; ${
          cookieOptions.secure ? "Secure; " : ""
        }SameSite=${cookieOptions.sameSite}; HttpOnly; Max-Age=2592000`
      );

      return {
        success: true,
        user: {
          id: user.id,
          openId: user.openId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /**
   * Get demo credentials (for display on login page)
   */
  getCredentials: publicProcedure.query(() => {
    return {
      username: DEMO_CREDENTIALS.username,
      password: DEMO_CREDENTIALS.password,
      email: DEMO_CREDENTIALS.email,
    };
  }),

  /**
   * Check if demo login is available
   */
  isAvailable: publicProcedure.query(() => {
    return { available: true };
  }),
});
