import type { MetadataResponse } from "../../../lib/types";

const WEBHOOK_URL =
  "https://n8n.zinetmedia.es/webhook/datos-fundacion";
const AUTH_HEADER = "fundacion-contenidos2026";
const AUTH_HEADER_FALLBACK = "fundacion";

/** Timeout for the outgoing metadata call (30 s). */
const FETCH_TIMEOUT_MS = 30_000;

export const dynamic = "force-dynamic";

export async function GET() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "GET",
      headers: {
        auth: AUTH_HEADER,
        [AUTH_HEADER_FALLBACK]: AUTH_HEADER,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { ok: false, error: errorText || "Error al cargar metadata." },
        { status: response.status }
      );
    }

    const data = (await response.json()) as MetadataResponse;
    const payload = Array.isArray(data) ? data[0] ?? {} : data;
    return Response.json(payload, { status: 200 });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return Response.json(
        { ok: false, error: "Timeout al cargar metadata del servidor externo." },
        { status: 504 }
      );
    }
    return Response.json(
      { ok: false, error: "Error inesperado al cargar metadata." },
      { status: 500 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
