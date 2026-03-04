const SESSION_COOKIE = "session_token";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/fundacionmuyinteresante; HttpOnly; Max-Age=0; SameSite=Lax`,
    },
  });
}
