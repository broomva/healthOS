import { z } from "zod";

const envSchema = z.object({
  // Required — app will not start without these
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required for JWT signing"),
  POSTGRES_URL: z.string().min(1, "POSTGRES_URL is required for database connection"),

  // Optional — have defaults or are only needed for specific features
  OLLAMA_BASE_URL: z.string().url().optional().default("http://localhost:11434/v1"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  AI_GATEWAY_API_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Observability — Sentry error tracking
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),

  // Environment detection — always available via Node.js runtime
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nPlease check your .env.local file or deployment environment.\n`
    );
  }

  _env = result.data;
  return _env;
}

export function env(): Env {
  if (!_env) {
    return validateEnv();
  }
  return _env;
}
