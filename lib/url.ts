/** Base path for the app, read from NEXT_PUBLIC_BASE_PATH. */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Prefix any path with the base path.
 * Used for both browser navigation and fetch() calls,
 * since Traefik needs the prefix to route to the correct container.
 */
export function url(path: string): string {
  return `${BASE}${path}`;
}
