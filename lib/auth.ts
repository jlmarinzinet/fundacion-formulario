import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "session_token";
const SECRET = process.env.AUTH_SECRET ?? "fundacion-default-secret-change-me";
const TOKEN_TTL = 60 * 60 * 24; // 24 hours in seconds

export type SessionPayload = {
  user: string;
  exp: number;
};

/** Create a signed token from a payload. */
function sign(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

/** Verify and decode a signed token. Returns null if invalid. */
function verify(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Create a session cookie for the given user. */
export async function createSession(user: string) {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
  };
  const token = sign(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_TTL,
    path: "/",
  });
}

/** Read and validate the current session. Returns the payload or null. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

/** Delete the session cookie. */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Verify credentials against env vars. */
export function validateCredentials(
  username: string,
  password: string
): boolean {
  const validUser = process.env.AUTH_USER ?? "admin";
  const validPass = process.env.AUTH_PASSWORD ?? "admin";
  return username === validUser && password === validPass;
}
