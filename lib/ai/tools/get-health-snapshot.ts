import fs from "node:fs/promises";
import path from "node:path";
import { tool } from "ai";
import matter from "gray-matter";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";

const DATA_DIR = path.join(process.cwd(), "data");

export const getHealthSnapshot = tool({
	description:
		"Get the latest weekly health snapshot including sleep, HRV, training status, body battery, and vitals. Returns structured metrics with alerts and trends. Use this when the user asks about their health overview, weekly summary, or general health status.",
	inputSchema: z.object({
		week: z
			.string()
			.describe(
				"Optional week identifier like '2026-W07'. If not provided, returns the latest available week.",
			)
			.optional(),
	}),
	execute: async (input) => {
		const log = logger.tool("getHealthSnapshot", { week: input.week });
		try {
			const weeklyDir = path.join(DATA_DIR, "weekly");
			const files = await fs.readdir(weeklyDir);
			const mdFiles = files
				.filter((f) => f.endsWith(".md"))
				.sort()
				.reverse();

			if (mdFiles.length === 0) {
				log.done({ empty: true });
				return {
					success: false,
					error: "No weekly health data available.",
					data: null,
				};
			}

			let targetFile = mdFiles[0];
			if (input.week) {
				const match = mdFiles.find((f) => f.includes(input.week as string));
				if (match) targetFile = match;
			}

			const raw = await fs.readFile(path.join(weeklyDir, targetFile), "utf-8");
			const { data: frontmatter, content } = matter(raw);

			log.done({
				week: frontmatter.week,
				alertCount: (frontmatter.alerts || []).length,
			});
			return {
				success: true,
				error: null,
				data: {
					week: frontmatter.week,
					dateRange: frontmatter.dateRange,
					metrics: frontmatter.metrics,
					alerts: frontmatter.alerts || [],
					tags: frontmatter.tags || [],
					analysis: content.trim(),
				},
			};
		} catch (error) {
			log.error(error);
			return {
				success: false,
				error: `Failed to read health snapshot: ${error instanceof Error ? error.message : String(error)}`,
				data: null,
			};
		}
	},
});
