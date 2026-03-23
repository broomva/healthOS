import * as Sentry from "@sentry/nextjs";
import { trace, context } from "@opentelemetry/api";

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  route?: string;
  ms?: number;
  [key: string]: unknown;
}

function getTraceContext(): Record<string, string> {
  const span = trace.getActiveSpan();
  if (!span) return {};
  const ctx = span.spanContext();
  return {
    traceId: ctx.traceId,
    spanId: ctx.spanId,
  };
}

function emit(entry: LogEntry) {
  const payload = {
    ...entry,
    ts: new Date().toISOString(),
    service: "healthos",
    ...getTraceContext(),
  };

  const out = JSON.stringify(payload);

  switch (entry.level) {
    case "error":
      console.error(out);
      break;
    case "warn":
      console.warn(out);
      break;
    default:
      console.log(out);
  }
}

export const logger = {
  info(msg: string, extra?: Record<string, unknown>) {
    emit({ level: "info", msg, ...extra });
  },

  warn(msg: string, extra?: Record<string, unknown>) {
    emit({ level: "warn", msg, ...extra });
  },

  error(msg: string, error?: unknown, extra?: Record<string, unknown>) {
    const errorInfo =
      error instanceof Error
        ? { error: error.message, stack: error.stack }
        : { error: String(error) };

    emit({ level: "error", msg, ...errorInfo, ...extra });

    // Also capture in Sentry for structured error tracking
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: { msg, ...extra } });
    }
  },

  /** Log the start of a request and return a `done` function that logs duration. */
  request(route: string, extra?: Record<string, unknown>) {
    const start = Date.now();
    emit({ level: "info", msg: "request:start", route, ...extra });

    return {
      done(status: number, extra?: Record<string, unknown>) {
        emit({
          level: "info",
          msg: "request:done",
          route,
          status,
          ms: Date.now() - start,
          ...extra,
        });
      },
      error(error: unknown, extra?: Record<string, unknown>) {
        const errorInfo =
          error instanceof Error
            ? { error: error.message }
            : { error: String(error) };
        emit({
          level: "error",
          msg: "request:error",
          route,
          ms: Date.now() - start,
          ...errorInfo,
          ...extra,
        });
      },
    };
  },

  /** Log a tool execution with timing. */
  tool(toolName: string, extra?: Record<string, unknown>) {
    const start = Date.now();
    emit({ level: "info", msg: "tool:start", tool: toolName, ...extra });

    return {
      done(extra?: Record<string, unknown>) {
        emit({
          level: "info",
          msg: "tool:done",
          tool: toolName,
          ms: Date.now() - start,
          ...extra,
        });
      },
      error(error: unknown) {
        const errorInfo =
          error instanceof Error
            ? { error: error.message }
            : { error: String(error) };
        emit({
          level: "error",
          msg: "tool:error",
          tool: toolName,
          ms: Date.now() - start,
          ...errorInfo,
        });
      },
    };
  },
};
