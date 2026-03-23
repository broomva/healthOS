import * as Sentry from "@sentry/nextjs";
import { type Span, SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer("healthos");

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

function endSpan(span: Span, ms: number, error?: unknown) {
  if (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error instanceof Error ? error.message : String(error) });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
  }
  span.setAttribute("duration_ms", ms);
  span.end();
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

  /** Log the start of a request and return helpers that log duration and end the OTel span. */
  request(route: string, extra?: Record<string, unknown>) {
    const start = Date.now();
    const span = tracer.startSpan(`HTTP ${route}`, {
      attributes: { "http.route": route, ...extra },
    });

    emit({ level: "info", msg: "request:start", route, ...extra });

    return {
      done(status: number, extra?: Record<string, unknown>) {
        const ms = Date.now() - start;
        span.setAttribute("http.status_code", status);
        endSpan(span, ms);
        emit({ level: "info", msg: "request:done", route, status, ms, ...extra });
      },
      error(error: unknown, extra?: Record<string, unknown>) {
        const ms = Date.now() - start;
        endSpan(span, ms, error);
        const errorInfo =
          error instanceof Error
            ? { error: error.message }
            : { error: String(error) };
        emit({ level: "error", msg: "request:error", route, ms, ...errorInfo, ...extra });
      },
    };
  },

  /** Log a tool execution with timing and an OTel span. */
  tool(toolName: string, extra?: Record<string, unknown>) {
    const start = Date.now();
    const span = tracer.startSpan(`tool:${toolName}`, {
      attributes: { "tool.name": toolName, ...extra },
    });

    emit({ level: "info", msg: "tool:start", tool: toolName, ...extra });

    return {
      done(extra?: Record<string, unknown>) {
        const ms = Date.now() - start;
        endSpan(span, ms);
        emit({ level: "info", msg: "tool:done", tool: toolName, ms, ...extra });
      },
      error(error: unknown) {
        const ms = Date.now() - start;
        endSpan(span, ms, error);
        const errorInfo =
          error instanceof Error
            ? { error: error.message }
            : { error: String(error) };
        emit({ level: "error", msg: "tool:error", tool: toolName, ms, ...errorInfo });

        if (error instanceof Error) {
          Sentry.captureException(error, { extra: { tool: toolName } });
        }
      },
    };
  },
};
