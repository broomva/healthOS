---
title: "Set up Sentry error monitoring and OpenTelemetry tracing"
identifier: "HOS-10"
id: "HOS-10"
state: todo
priority: 3
project: "healthOS"
---

# HOS-10: Set up Sentry error monitoring and OpenTelemetry tracing

The project has @opentelemetry dependencies and an instrumentation.ts file but needs proper error monitoring setup.

## Implementation
- Configure Sentry for error tracking (already a devDep consideration)
- Wire OpenTelemetry instrumentation for API routes
- Add structured logging for health tool executions
- Set up Railway-compatible environment variables for observability

## Acceptance Criteria
- Errors in production are captured and reported
- API route latency is tracked
- Health tool executions are traced
- Dashboard or log output shows traces
