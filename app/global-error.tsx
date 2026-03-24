"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<html lang="en">
			<body>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						minHeight: "100vh",
						fontFamily: "system-ui, sans-serif",
						gap: "1rem",
					}}
				>
					<h2>Something went wrong</h2>
					<button type="button" onClick={reset}>
						Try again
					</button>
				</div>
			</body>
		</html>
	);
}
