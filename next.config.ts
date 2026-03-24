import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	cacheComponents: true,
	images: {
		remotePatterns: [
			{
				hostname: "avatar.vercel.sh",
			},
			{
				protocol: "https",
				//https://nextjs.org/docs/messages/next-image-unconfigured-host
				hostname: "*.public.blob.vercel-storage.com",
			},
		],
	},
};

export default withSentryConfig(nextConfig, {
	// Only upload source maps when auth token is available (CI builds)
	authToken: process.env.SENTRY_AUTH_TOKEN,
	org: process.env.SENTRY_ORG,
	project: process.env.SENTRY_PROJECT,

	silent: !process.env.CI,
	disableLogger: true,

	// Automatically tree-shake Sentry logger to reduce bundle size
	bundleSizeOptimizations: {
		excludeDebugStatements: true,
		excludeReplayIframe: true,
		excludeReplayShadowDom: true,
	},
});
