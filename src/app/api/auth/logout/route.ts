import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookie";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", { ...authCookieOptions(), maxAge: 0 });
  return NextResponse.json({ message: "Signed out" });
}
