import { NextResponse } from "next/server";
import { googleOAuthConfigError } from "@/lib/auth/env";
import {
  GOOGLE_OAUTH_FROM_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/constants";
import {
  googleOAuthCallbackUrl,
  newOAuthState,
  publicAppOrigin,
  safePostLoginPath,
} from "@/lib/auth/google-oauth";

const OAUTH_STATE_MAX_AGE = 600;

function shortCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function redirectToLogin(req: Request, message: string) {
  const u = new URL("/login", req.url);
  u.searchParams.set("error", message);
  return NextResponse.redirect(u);
}

export async function GET(req: Request) {
  const cfg = googleOAuthConfigError();
  if (cfg) {
    return redirectToLogin(req, cfg);
  }

  const origin = publicAppOrigin(req);
  if (!origin) {
    return redirectToLogin(req, "Could not determine app URL. Set NEXT_PUBLIC_APP_URL.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const state = newOAuthState();
  const url = new URL(req.url);
  const from = safePostLoginPath(url.searchParams.get("from"));

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", googleOAuthCallbackUrl(origin));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, state, shortCookieOptions(OAUTH_STATE_MAX_AGE));
  res.cookies.set(GOOGLE_OAUTH_FROM_COOKIE, from, shortCookieOptions(OAUTH_STATE_MAX_AGE));
  return res;
}
