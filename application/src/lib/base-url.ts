/**
 * Helper to resolve the dynamic or configured Base URL for Flurf.
 * Priority:
 * 1. process.env.NEXT_PUBLIC_APP_URL (if explicitly set in environment)
 * 2. window.location.origin (if running client-side in browser)
 * 3. Fallback to "https://flurf.trade"
 */
export function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return "https://flurf.trade";
}

/**
 * Helper to get clean display domain without protocol (e.g. "flurf.trade", "flurf.vercel.app", "localhost:3000")
 */
export function getAppDisplayDomain(): string {
  return getAppBaseUrl().replace(/^https?:\/\//, "").replace(/\/$/, "");
}
