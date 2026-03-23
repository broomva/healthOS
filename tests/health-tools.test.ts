import { describe, expect, test } from "bun:test";
import { garminQuery } from "../lib/ai/tools/garmin-query";
import { getHealthSnapshot } from "../lib/ai/tools/get-health-snapshot";
import { getTrainingStatus } from "../lib/ai/tools/get-training-status";
import { getVitals } from "../lib/ai/tools/get-vitals";
import { renderHealthUI } from "../lib/ai/tools/render-health-ui";

// AI SDK tool.execute takes (args, options) — provide minimal options
const exec = (tool: { execute: Function }, args: Record<string, unknown>) =>
  tool.execute(args, { toolCallId: "test", messages: [] });

// ─── Health Snapshot ────────────────────────────────────────────────

describe("getHealthSnapshot", () => {
  test("returns latest weekly snapshot with all required fields", async () => {
    const result = await exec(getHealthSnapshot, {});

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("week");
    expect(result).toHaveProperty("dateRange");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("alerts");
    expect(result).toHaveProperty("tags");
    expect(result).toHaveProperty("analysis");
    expect(typeof result.analysis).toBe("string");
    expect(result.analysis.length).toBeGreaterThan(0);
  });

  test("parses specific week with correct metric values", async () => {
    const result = await exec(getHealthSnapshot, { week: "2026-W07" });

    expect(result.week).toBe("2026-W07");
    expect(result.dateRange).toBe("Feb 7 - Feb 13, 2026");
    expect(result.metrics.sleepScore.avg).toBe(74.8);
    expect(result.metrics.trainingStatus.label).toBe("MAINTAINING");
    expect(result.metrics.acwr.ratio).toBe(1.1);
    expect(result.metrics.acwr.status).toBe("OPTIMAL");
    expect(result.metrics.hrv.status).toBe("UNBALANCED");
  });

  test("parses alerts array with severity types", async () => {
    const result = await exec(getHealthSnapshot, { week: "2026-W07" });

    expect(Array.isArray(result.alerts)).toBe(true);
    expect(result.alerts.length).toBeGreaterThan(0);

    for (const alert of result.alerts) {
      expect(["info", "warning", "critical"]).toContain(alert.type);
      expect(alert).toHaveProperty("metric");
      expect(alert).toHaveProperty("message");
    }
  });

  test("falls back to latest when week not found", async () => {
    const result = await exec(getHealthSnapshot, { week: "9999-W01" });

    // Should still return the latest available, not error
    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("week");
  });
});

// ─── Vitals ─────────────────────────────────────────────────────────

describe("getVitals", () => {
  test("returns single day with parsed sleep and physiological metrics", async () => {
    const result = await exec(getVitals, { date: "2026-02-10", days: 1 });

    expect(result).not.toHaveProperty("error");
    expect(result.count).toBe(1);
    expect(result.days).toHaveLength(1);

    const day = result.days[0];
    expect(day.date).toBe("2026-02-10");
    expect(day.metrics.sleepScore).toBe(75);
    expect(day.metrics.hrv.avg).toBe(40.0);
    expect(day.metrics.hrv.status).toBe("LOW");
    expect(day.metrics.rhr.value).toBe(54.0);
    expect(day.metrics.rhr.unit).toBe("bpm");
    expect(day.metrics.spo2.avg).toBe(91.0);
    expect(day.metrics.bodyBattery.change).toBe(41);
  });

  test("returns multiple days with consistent structure", async () => {
    const result = await exec(getVitals, { days: 3 });

    expect(result).not.toHaveProperty("error");
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.days.length).toBe(result.count);

    for (const day of result.days) {
      expect(day).toHaveProperty("date");
      expect(day).toHaveProperty("metrics");
      expect(day).toHaveProperty("summary");
      expect(typeof day.summary).toBe("string");
    }
  });

  test("caps days at maximum of 14", async () => {
    const result = await exec(getVitals, { days: 100 });

    expect(result).not.toHaveProperty("error");
    expect(result.count).toBeLessThanOrEqual(14);
  });
});

// ─── Training Status ────────────────────────────────────────────────

describe("getTrainingStatus", () => {
  test("returns training readiness with factor breakdown", async () => {
    const result = await exec(getTrainingStatus, { date: "2026-02-15" });

    expect(result).not.toHaveProperty("error");
    expect(result.date).toBe("2026-02-15");

    const { metrics } = result;
    // Training readiness
    expect(metrics.trainingReadiness.score).toBe(33);
    expect(metrics.trainingReadiness.level).toBe("LOW");
    expect(metrics.trainingReadiness.factors.sleepHistory.feedback).toBe(
      "POOR",
    );

    // ACWR
    expect(metrics.acwr.ratio).toBe(1.1);
    expect(metrics.acwr.status).toBe("OPTIMAL");
    expect(metrics.acwr.acuteLoad).toBe(165);
    expect(metrics.acwr.chronicLoad).toBe(148);

    // HRV baseline
    expect(metrics.hrv.weeklyAvg).toBe(42);
    expect(metrics.hrv.status).toBe("UNBALANCED");
    expect(metrics.hrv.baseline.balancedLow).toBe(43);
    expect(metrics.hrv.baseline.balancedUpper).toBe(56);

    // Altitude
    expect(metrics.altitude.current).toBe(2565);
    expect(metrics.altitude.acclimation).toBe(91);
    expect(metrics.altitude.trend).toBe("DEACCLIMATIZING");

    // Lactate threshold
    expect(metrics.lactateThreshold.ftp).toBe(371);
    expect(metrics.lactateThreshold.powerToWeight).toBe(5.71);
  });

  test("returns latest data with analysis when no date specified", async () => {
    const result = await exec(getTrainingStatus, {});

    expect(result).not.toHaveProperty("error");
    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("metrics");
    expect(result).toHaveProperty("analysis");
    expect(typeof result.analysis).toBe("string");
    expect(result.analysis.length).toBeGreaterThan(0);
  });
});

// ─── Garmin Query Fallback ──────────────────────────────────────────

describe("garminQuery", () => {
  // The garmin-connect CLI has a 30s timeout, so tests need longer than Bun's 5s default
  test(
    "gracefully handles CLI unavailability or errors",
    async () => {
      const result = await exec(garminQuery, {
        command: "health sleep",
        args: [],
      });

      // Tool must never throw — it always returns a structured result
      expect(result).toBeDefined();

      if (result.unavailable) {
        // CLI not installed — expected in CI/cloud
        expect(result.command).toBe("garmin-connect health sleep");
        expect(result.message).toContain("Garmin Connect CLI is not available");
        expect(result.description).toContain("Sleep data");
      } else if (result.error) {
        // CLI exists but errored (auth expired, timeout, etc.)
        expect(typeof result.error).toBe("string");
      } else {
        // CLI available and responded — verify structured output
        expect(result).toHaveProperty("command");
        expect(result).toHaveProperty("description");
      }
    },
    { timeout: 35_000 },
  );

  test(
    "returns structured result for training command",
    async () => {
      const result = await exec(garminQuery, {
        command: "training readiness",
        args: [],
      });

      expect(result).toBeDefined();

      if (result.unavailable) {
        expect(result.command).toBe("garmin-connect training readiness");
        expect(result.description).toContain("Training readiness");
      } else if (result.error) {
        expect(typeof result.error).toBe("string");
      } else {
        expect(result).toHaveProperty("data");
      }
    },
    { timeout: 35_000 },
  );
});

// ─── Health UI Renderer ─────────────────────────────────────────────

describe("renderHealthUI", () => {
  test("renders valid spec with correct component count", async () => {
    const result = await exec(renderHealthUI, {
      title: "Sleep Dashboard",
      spec: {
        root: "section-1",
        elements: {
          "section-1": {
            type: "SectionCard",
            props: { title: "Sleep Analysis", variant: "sleep" },
            children: ["grid-1"],
          },
          "grid-1": {
            type: "MetricGrid",
            props: { columns: 3 },
            children: ["m1", "m2", "m3"],
          },
          m1: {
            type: "MetricCard",
            props: { label: "Score", value: "82", status: "good" },
          },
          m2: {
            type: "MetricCard",
            props: { label: "HRV", value: "53ms", status: "warning" },
          },
          m3: {
            type: "MetricCard",
            props: { label: "RHR", value: "54bpm", status: "good" },
          },
        },
      },
    });

    expect(result).not.toHaveProperty("error");
    expect(result.title).toBe("Sleep Dashboard");
    expect(result.componentCount).toBe(5);
    expect(result.spec.root).toBe("section-1");
  });

  test("returns error for invalid root reference", async () => {
    const result = await exec(renderHealthUI, {
      title: "Test",
      spec: {
        root: "nonexistent",
        elements: {
          "section-1": {
            type: "SectionCard",
            props: { title: "Test" },
          },
        },
      },
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("nonexistent");
    expect(result.error).toContain("not found");
  });

  test("returns error for invalid child reference", async () => {
    const result = await exec(renderHealthUI, {
      title: "Test",
      spec: {
        root: "section-1",
        elements: {
          "section-1": {
            type: "SectionCard",
            props: { title: "Test" },
            children: ["missing-child"],
          },
        },
      },
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("missing-child");
    expect(result.error).toContain("does not exist");
  });
});
