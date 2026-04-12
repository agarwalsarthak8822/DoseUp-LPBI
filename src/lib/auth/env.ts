/** Returns a user-safe error message if JWT signing cannot run, else null. */
export function jwtSecretConfigError(): string | null {
  const s = process.env.JWT_SECRET?.trim();
  if (!s) {
    return "Sign-in is not configured: set JWT_SECRET (at least 32 characters) in .env.local.";
  }
  if (s.length < 32) {
    return "JWT_SECRET must be at least 32 characters. Generate one with: openssl rand -base64 32";
  }
  return null;
}

/** Returns a user-safe error message if Google OAuth is not configured, else null. */
export function googleOAuthConfigError(): string | null {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) {
    return "Google sign-in is not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local.";
  }
  return null;
}
