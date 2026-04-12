/**
 * HS256 JWT verify for Edge middleware (Web Crypto only — avoids jose + CompressionStream warnings).
 * Must stay compatible with tokens issued by `signAuthToken` in jwt.ts (jose SignJWT, HS256).
 */

function base64UrlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function verifyAuthTokenEdge(
  token: string,
  secret: string
): Promise<{ sub: string; email: string; name: string } | null> {
  if (!secret || secret.length < 32) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToBytes(sigB64);
    const ok = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!ok) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64))) as Record<
      string,
      unknown
    >;
    const exp = payload.exp;
    if (typeof exp === "number" && exp * 1000 < Date.now()) return null;

    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    if (!sub || !email) return null;
    return { sub, email, name };
  } catch {
    return null;
  }
}
