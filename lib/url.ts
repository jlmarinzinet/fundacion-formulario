/** Base path for the app, read from NEXT_PUBLIC_BASE_PATH. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a path with the base path. e.g. url("/api/submit") → "/fundacionmuyinteresante/api/submit" */
export function url(path: string): string {
  return `${BASE}${path}`;
}
