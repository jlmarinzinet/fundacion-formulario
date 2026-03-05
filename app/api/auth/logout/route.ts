const SESSION_COOKIE = "session_token";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=${basePath}; HttpOnly; Max-Age=0; SameSite=Lax`,
    },
  });
}
