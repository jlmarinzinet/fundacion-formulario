/** Base path for the app, read from NEXT_PUBLIC_BASE_PATH. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix a path for browser navigation (window.location.href).
 * e.g. nav("/login") → "/fundacionmuyinteresante/login"
 */
export function nav(path: string): string {
  return `${BASE}${path}`;
}

/**
 * Prefix a path for fetch() calls.
 * Since Traefik strips the base path before forwarding to the container,
 * fetch() calls go directly to "/api/..." without prefix.
 */
export function api(path: string): string {
  return path;
}
