"use client";

/** Logs an error to the server-side error log table. Fire-and-forget — never throws. */
export async function logError(
  message: string,
  context?: Record<string, unknown>,
  level: "error" | "warn" | "info" = "error"
) {
  try {
    await fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context, level, path: window.location.pathname }),
    });
  } catch {
    // swallow — logging should never break the app
  }
}
