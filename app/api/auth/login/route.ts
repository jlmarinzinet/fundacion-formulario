import { createSession, validateCredentials } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return Response.json(
        { ok: false, error: "Usuario y contraseña son obligatorios." },
        { status: 400 }
      );
    }

    if (!validateCredentials(username, password)) {
      return Response.json(
        { ok: false, error: "Credenciales incorrectas." },
        { status: 401 }
      );
    }

    await createSession(username);
    return Response.json({ ok: true }, { status: 200 });
  } catch {
    return Response.json(
      { ok: false, error: "Error al procesar la solicitud." },
      { status: 500 }
    );
  }
}
