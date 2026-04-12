import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuthTokenEdge } from "@/lib/auth/jwt-edge";
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants";

const protectedPrefixes = ["/order", "/track", "/account"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.JWT_SECRET ?? "";

  if (!token) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  const session = await verifyAuthTokenEdge(token, secret);
  if (!session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    const res = NextResponse.redirect(login);
    res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/order",
    "/order/:path*",
    "/track",
    "/track/:path*",
    "/account",
    "/account/:path*",
  ],
};
