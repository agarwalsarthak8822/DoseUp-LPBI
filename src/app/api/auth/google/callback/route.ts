import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db/mongodb";
import { UserModel } from "@/lib/models/User";
import { signAuthToken } from "@/lib/auth/jwt";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookie";
import { jwtSecretConfigError, googleOAuthConfigError } from "@/lib/auth/env";
import {
  GOOGLE_OAUTH_FROM_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/constants";
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  googleOAuthCallbackUrl,
  publicAppOrigin,
  safePostLoginPath,
} from "@/lib/auth/google-oauth";

function clearOAuthCookies(res: NextResponse) {
  const cleared = { path: "/", maxAge: 0 } as const;
  res.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", cleared);
  res.cookies.set(GOOGLE_OAUTH_FROM_COOKIE, "", cleared);
}

function redirectToLogin(req: Request, message: string) {
  const u = new URL("/login", req.url);
  u.searchParams.set("error", message);
  const res = NextResponse.redirect(u);
  clearOAuthCookies(res);
  return res;
}

export async function GET(req: Request) {
  const jwtErr = jwtSecretConfigError();
  if (jwtErr) {
    return redirectToLogin(req, jwtErr);
  }
  const googleErr = googleOAuthConfigError();
  if (googleErr) {
    return redirectToLogin(req, googleErr);
  }

  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return redirectToLogin(req, err === "access_denied" ? "Google sign-in was cancelled." : "Google sign-in failed.");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) {
    return redirectToLogin(req, "Missing authorization code.");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const fromRaw = cookieStore.get(GOOGLE_OAUTH_FROM_COOKIE)?.value;
  const dest = safePostLoginPath(fromRaw);

  if (!expectedState || expectedState !== state) {
    return redirectToLogin(req, "Invalid or expired sign-in session. Try again.");
  }

  const origin = publicAppOrigin(req);
  if (!origin) {
    return redirectToLogin(req, "Could not determine app URL. Set NEXT_PUBLIC_APP_URL.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!.trim();
  const redirectUri = googleOAuthCallbackUrl(origin);

  const tokenRes = await exchangeGoogleCode({
    code,
    redirectUri,
    clientId,
    clientSecret,
  });
  if ("error" in tokenRes) {
    return redirectToLogin(req, "Could not complete Google sign-in. Try again.");
  }

  const profile = await fetchGoogleUserInfo(tokenRes.access_token);
  if ("error" in profile) {
    return redirectToLogin(req, "Could not read your Google profile.");
  }
  if (!profile.email_verified) {
    return redirectToLogin(req, "Your Google email must be verified to sign in.");
  }

  try {
    await connectDB();
  } catch (e) {
    console.error(e);
    return redirectToLogin(req, "Database is unavailable. Try again later.");
  }

  const { sub, email, name } = profile;

  let user = await UserModel.findOne({ googleId: sub });
  if (!user) {
    const existing = await UserModel.findOne({ email }).select("+passwordHash googleId");
    if (existing) {
      const hasPassword =
        typeof existing.passwordHash === "string" && existing.passwordHash.length > 0;
      if (hasPassword && !existing.googleId) {
        return redirectToLogin(
          req,
          "An account with this email already uses a password. Log in with email and password."
        );
      }
      if (existing.googleId && existing.googleId !== sub) {
        return redirectToLogin(req, "This email is linked to a different Google account.");
      }
      existing.googleId = sub;
      if (name && (!existing.name || existing.name.trim().length < 2)) {
        existing.name = name.slice(0, 100);
      }
      await existing.save();
      user = existing;
    }
  }

  if (!user) {
    try {
      user = await UserModel.create({
        name: name.slice(0, 100),
        email,
        googleId: sub,
      });
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && "code" in e && (e as { code: number }).code === 11000) {
        return redirectToLogin(req, "An account with this email already exists.");
      }
      console.error(e);
      return redirectToLogin(req, "Could not create your account.");
    }
  }

  try {
    const token = await signAuthToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    const ok = new URL(dest, req.url);
    const res = NextResponse.redirect(ok);
    res.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    clearOAuthCookies(res);
    return res;
  } catch (e) {
    console.error(e);
    return redirectToLogin(req, "Could not complete sign-in.");
  }
}
