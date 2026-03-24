import postgres from "postgres";

export async function GET() {
	const checks: Record<string, "ok" | "error"> = {};

	// Database connectivity check
	try {
		const client = postgres(process.env.POSTGRES_URL ?? "", { max: 1 });
		await client`SELECT 1`;
		await client.end();
		checks.database = "ok";
	} catch {
		checks.database = "error";
	}

	const allOk = Object.values(checks).every((v) => v === "ok");

	return Response.json(
		{
			status: allOk ? "ok" : "degraded",
			checks,
			version: process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
			uptime: Math.floor(process.uptime()),
		},
		{ status: allOk ? 200 : 503 },
	);
}
