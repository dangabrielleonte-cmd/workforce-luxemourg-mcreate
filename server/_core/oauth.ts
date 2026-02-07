import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      console.error("[OAuth] Missing code or state", { code: !!code, state: !!state });
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      console.log("[OAuth] Processing callback with code and state");
      
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      console.log("[OAuth] Token exchanged successfully");
      
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      console.log("[OAuth] User info retrieved:", { openId: userInfo.openId, email: userInfo.email });

      if (!userInfo.openId) {
        console.error("[OAuth] Missing openId in user info");
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Upsert user to database
      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });
      console.log("[OAuth] User upserted to database");

      // Create session token
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      console.log("[OAuth] Session token created");

      // Set session cookie with proper options
      const cookieOptions = getSessionCookieOptions(req);
      console.log("[OAuth] Setting cookie with options:", {
        path: cookieOptions.path,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure,
        domain: cookieOptions.domain,
        httpOnly: cookieOptions.httpOnly,
      });
      
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      console.log("[OAuth] Cookie set, redirecting to /");
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: "OAuth callback failed", details: errorMessage });
    }
  });

  // Health check endpoint for debugging
  app.get("/api/health/auth", (req: Request, res: Response) => {
    const cookies = req.headers.cookie || "no cookies";
    const protocol = req.protocol;
    const hostname = req.hostname;
    const forwardedProto = req.headers["x-forwarded-proto"];
    
    res.json({
      status: "ok",
      protocol,
      hostname,
      forwardedProto,
      hasCookies: !!req.headers.cookie,
      cookieNames: req.headers.cookie
        ? req.headers.cookie.split(";").map(c => c.split("=")[0].trim())
        : [],
    });
  });
}
