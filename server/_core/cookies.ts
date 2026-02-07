import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isSecure = isSecureRequest(req);
  
  // Determine if we should set domain
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIpAddress(hostname) &&
    hostname !== "127.0.0.1" &&
    hostname !== "::1";

  // Set domain for cross-subdomain cookie sharing
  let domain: string | undefined = undefined;
  if (shouldSetDomain) {
    // For production domains, set domain to parent domain
    // e.g., ".example.com" instead of "app.example.com"
    if (!hostname.startsWith(".")) {
      const parts = hostname.split(".");
      if (parts.length > 2) {
        // Remove subdomain, keep main domain + TLD
        domain = `.${parts.slice(-2).join(".")}`;
      } else {
        domain = hostname;
      }
    } else {
      domain = hostname;
    }
  }

  return {
    httpOnly: true,
    path: "/",
    // Use 'lax' for better compatibility
    sameSite: "lax",
    secure: isSecure,
    domain: domain,
  };
}
