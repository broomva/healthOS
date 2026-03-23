import * as Sentry from "@sentry/nextjs";
import { registerOTel } from "@vercel/otel";
import { validateEnv } from "@/lib/env";

export async function register() {
  validateEnv();
  registerOTel({ serviceName: "healthos" });

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
