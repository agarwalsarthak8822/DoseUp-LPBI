import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { JWT_EXPIRES_DAYS } from "./constants";

export type AuthTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(user: {
  id: string;
  email: string;
  name: string;
}): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRES_DAYS}d`)
    .sign(key);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key);
    const sub = payload.sub;
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    if (!sub || !email) return null;
    return { ...payload, sub, email, name } as AuthTokenPayload;
  } catch {
    return null;
  }
}
