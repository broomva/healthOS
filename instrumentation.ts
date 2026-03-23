import { registerOTel } from "@vercel/otel";
import { validateEnv } from "@/lib/env";

export function register() {
  validateEnv();
  registerOTel({ serviceName: "ai-chatbot" });
}
