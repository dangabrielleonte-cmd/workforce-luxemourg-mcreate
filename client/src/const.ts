export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// DISABLED: Using demo login instead of Manus OAuth
// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Return demo login page instead of OAuth
  return "/login";
};

// Legacy OAuth URL - kept for reference but not used
export const getOAuthUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
