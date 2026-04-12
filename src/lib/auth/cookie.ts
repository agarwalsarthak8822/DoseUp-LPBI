import { AUTH_COOKIE_NAME, JWT_EXPIRES_DAYS } from "./constants";

const maxAge = 60 * 60 * 24 * JWT_EXPIRES_DAYS;

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export { AUTH_COOKIE_NAME };
