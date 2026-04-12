import { randomBytes } from "node:crypto";

/** Only allow same-origin relative redirects after OAuth. */
export function safePostLoginPath(from: string | null | undefined): string {
  if (!from || typeof from !== "string") return "/account";
  const t = from.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/account";
  return t;
}

export function publicAppOrigin(req: Request): string | null {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) {
    try {
      return new URL(env).origin;
    } catch {
      return null;
    }
  }
  try {
    return new URL(req.url).origin;
  } catch {
    return null;
  }
}

export function googleOAuthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function newOAuthState(): string {
  return randomBytes(24).toString("hex");
}

export type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
};

export async function exchangeGoogleCode(params: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ access_token: string } | { error: string }> {
  const body = new URLSearchParams({
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.error_description === "string"
        ? data.error_description
        : typeof data.error === "string"
          ? data.error
          : "token_exchange_failed";
    return { error: msg };
  }
  const token = data.access_token;
  if (typeof token !== "string" || !token) {
    return { error: "no_access_token" };
  }
  return { access_token: token };
}

export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo | { error: string }> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    return { error: typeof data.error === "string" ? data.error : "userinfo_failed" };
  }
  const sub = typeof data.sub === "string" ? data.sub : "";
  const email = typeof data.email === "string" ? data.email.toLowerCase().trim() : "";
  const name = typeof data.name === "string" && data.name.trim() ? data.name.trim() : email || "User";
  const email_verified = data.email_verified === true;
  if (!sub || !email) {
    return { error: "incomplete_profile" };
  }
  return { sub, email, email_verified, name };
}
