import { NextResponse } from "next/server";
import { validateCredentials } from "../../../../lib/auth";
import crypto from "crypto";

const SESSION_COOKIE = "session_token";
const SECRET = process.env.AUTH_SECRET ?? "fundacion-default-secret-change-me";
const TOKEN_TTL = 60 * 60 * 24; // 24 hours

function sign(payload: { user: string; exp: number }): string {
  const json = JSON.stringify(payload);
  const data = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { ok: false, error: "Usuario y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    if (!validateCredentials(username, password)) {
      return NextResponse.json(
        { ok: false, error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    const token = sign({
      user: username,
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL,
    });

    const useSecure = process.env.COOKIE_SECURE === "true";
    const cookieParts = [
      `${SESSION_COOKIE}=${token}`,
      `Path=/`,
      `HttpOnly`,
      `Max-Age=${TOKEN_TTL}`,
      `SameSite=Lax`,
    ];
    if (useSecure) cookieParts.push("Secure");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": cookieParts.join("; "),
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}
