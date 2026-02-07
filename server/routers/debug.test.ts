import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";
import type { User } from "../../drizzle/schema";

function createMockContext(user: User | null): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      hostname: "example.com",
      url: "/api/trpc",
      method: "GET",
      headers: {
        cookie: "manus-session=test-token",
        "user-agent": "test-agent",
        "x-forwarded-proto": "https",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createMockUser(): User {
  return {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

describe("debug router", () => {
  it("should return session status when user is authenticated", async () => {
    const user = createMockUser();
    const ctx = createMockContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debug.sessionStatus();

    expect(result.isAuthenticated).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.openId).toBe("test-user-123");
    expect(result.user?.email).toBe("test@example.com");
  });

  it("should return null user when not authenticated", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debug.sessionStatus();

    expect(result.isAuthenticated).toBe(false);
    expect(result.user).toBeNull();
  });

  it("should return request headers", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debug.headers();

    expect(result.protocol).toBe("https");
    expect(result.hostname).toBe("example.com");
    expect(result.headers).toBeDefined();
    expect(result.headers.cookie).toBe("[REDACTED]");
  });

  it("should verify session cookie presence", async () => {
    const ctx = createMockContext(null);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debug.verifySession();

    expect(result.hasCookie).toBe(true);
    expect(result.sessionCookiePresent).toBe(true);
    expect(result.cookieNames).toContain("manus-session");
  });

  it("should handle missing cookies", async () => {
    const ctx = createMockContext(null);
    ctx.req.headers.cookie = undefined;
    const caller = appRouter.createCaller(ctx);

    const result = await caller.debug.verifySession();

    expect(result.hasCookie).toBe(false);
    expect(result.message).toBe("No cookies found in request");
  });
});
