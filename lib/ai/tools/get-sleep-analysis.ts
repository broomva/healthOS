import fs from "node:fs/promises";
import path from "node:path";
import { tool } from "ai";
import matter from "gray-matter";
import { z } from "zod";
import { logger } from "@/lib/observability/logger";

const DATA_DIR = path.join(process.cwd(), "data");

export const getSleepAnalysis = tool({
	description:
		"Get comprehensive sleep analysis including sleep architecture (deep, REM, light percentages), sleep score trends, HRV overnight data, SpO2, and monthly/weekly trend comparisons. Use this when the user asks about their sleep quality, sleep patterns, or sleep-related health metrics.",
	inputSchema: z.object({
		period: z
			.enum(["latest", "full"])
			.describe(
				"'latest' for the most recent analysis, 'full' for the complete historical analysis",
			)
			.default("latest"),
	}),
	execute: async (input) => {
		const log = logger.tool("getSleepAnalysis", { period: input.period });
		try {
			const sleepDir = path.join(DATA_DIR, "sleep");
			const files = await fs.readdir(sleepDir);
			const mdFiles = files
				.filter((f) => f.endsWith(".md"))
				.sort()
				.reverse();

			if (mdFiles.length === 0) {
				log.done({ empty: true });
				return {
					success: false,
					error: "No sleep analysis data available.",
					data: null,
				};
			}

			const raw = await fs.readFile(path.join(sleepDir, mdFiles[0]), "utf-8");
			const { data: frontmatter, content } = matter(raw);

			log.done({ periodCovered: frontmatter.periodCovered });
			return {
				success: true,
				error: null,
				data: {
					periodCovered: frontmatter.periodCovered,
					dataPoints: frontmatter.dataPoints,
					summary: frontmatter.summary,
					analysis: content.trim(),
				},
			};
		} catch (error) {
			log.error(error);
			return {
				success: false,
				error: `Failed to read sleep analysis: ${error}`,
				data: null,
			};
		}
	},
});
