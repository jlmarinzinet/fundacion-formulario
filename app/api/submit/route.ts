const WEBHOOK_URL =
  "https://n8n.zinetmedia.es/webhook/fundacion-contenidos";
const AUTH_HEADER = "fundacion-contenidos2026";
const AUTH_HEADER_FALLBACK = "fundacion";

/** Maximum allowed request body size (50 MB). */
const MAX_BODY_SIZE = 50 * 1024 * 1024;
/** Timeout for the outgoing webhook call (120 s). */
const FETCH_TIMEOUT_MS = 120_000;

export const dynamic = "force-dynamic";

/**
 * Streaming proxy – forwards the request body to the webhook
 * WITHOUT buffering it into memory.  The client already validates
 * file types and sizes; the webhook should do so as well.
 *
 * Previously this route called `request.formData()` which loaded
 * the entire upload into RAM, then built a *second* FormData
 * (another copy), and finally serialized it again for `fetch()`.
 * That meant ~3× the file-size in memory per request, causing OOM
 * on even moderate uploads.
 */
export async function POST(request: Request) {
  /* ── early size guard ─────────────────────────────────────── */
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json(
      {
        ok: false,
        error: `El cuerpo excede el límite de ${MAX_BODY_SIZE / (1024 * 1024)} MB.`,
      },
      { status: 413 }
    );
  }

  /* ── validate content-type before proxying ────────────────── */
  const incomingCT = request.headers.get("content-type") ?? "";
  if (!incomingCT.includes("multipart/form-data")) {
    return Response.json(
      { ok: false, error: "Se esperaba multipart/form-data." },
      { status: 400 }
    );
  }

  /* ── stream body to webhook (zero-copy) ───────────────────── */
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "content-type": incomingCT, // preserve multipart boundary
        auth: AUTH_HEADER,
        [AUTH_HEADER_FALLBACK]: AUTH_HEADER,
      },
      body: request.body,           // ReadableStream – no buffering
      signal: controller.signal,
      // @ts-expect-error -- Node.js fetch requires duplex for streaming body
      duplex: "half",
    });

    clearTimeout(timeout);

    const respCT = response.headers.get("content-type") ?? "";
    const data = respCT.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return Response.json(
        { ok: false, error: data || "Error al reenviar." },
        { status: response.status }
      );
    }

    return Response.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    clearTimeout(timeout);

    if (
      error instanceof DOMException && error.name === "AbortError" ||
      (error as NodeJS.ErrnoException)?.code === "ABORT_ERR"
    ) {
      return Response.json(
        { ok: false, error: "Timeout al enviar al servidor externo." },
        { status: 504 }
      );
    }
    return Response.json(
      { ok: false, error: "Error inesperado al enviar." },
      { status: 500 }
    );
  }
}
