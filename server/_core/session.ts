/**
 * Session token management for demo and OAuth authentication
 */

import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const secret = new TextEncoder().encode(ENV.cookieSecret);

export async function createSessionToken(userId: number, openId: string): Promise<string> {
  const token = await new SignJWT({
    userId,
    openId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(secret);

  return token;
}

export async function verifySessionToken(
  token: string
): Promise<{ userId: number; openId: string } | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return {
      userId: verified.payload.userId as number,
      openId: verified.payload.openId as string,
    };
  } catch (error) {
    return null;
  }
}
