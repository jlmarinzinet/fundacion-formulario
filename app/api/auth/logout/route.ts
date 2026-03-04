import { NextResponse } from "next/server";

const SESSION_COOKIE = "session_token";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
