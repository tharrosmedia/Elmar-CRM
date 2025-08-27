// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  if (username && password) {
    // Mock: Accept any non-empty credentials for internal testing
    const response = NextResponse.json({ success: true });
    response.cookies.set("session", "mock-token", {
      httpOnly: true,
      maxAge: 3600, // 1 hour
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  }
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}