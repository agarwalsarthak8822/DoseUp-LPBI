import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db/mongodb";
import { UserModel } from "@/lib/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signAuthToken } from "@/lib/auth/jwt";
import { loginBodySchema } from "@/lib/validations/auth";
import { AUTH_COOKIE_NAME, authCookieOptions } from "@/lib/auth/cookie";
import { jwtSecretConfigError } from "@/lib/auth/env";

export async function POST(req: Request) {
  const jwtErr = jwtSecretConfigError();
  if (jwtErr) {
    return NextResponse.json({ error: jwtErr }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginBodySchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.flatten();
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: first.fieldErrors },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;

  try {
    await connectDB();
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Database configuration error" }, { status: 500 });
  }

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  const ok = user && (await verifyPassword(password, user.passwordHash));

  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  try {
    const token = await signAuthToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, authCookieOptions());
    return NextResponse.json({
      message: "Signed in successfully",
      user: { id: user._id.toString(), name: user.name, email: user.email },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not complete sign-in" }, { status: 500 });
  }
}
