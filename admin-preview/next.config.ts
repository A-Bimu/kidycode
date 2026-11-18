import type { NextConfig } from "next";

/*
 * The Vercel review target's Next configuration.
 *
 * This app is deliberately separate from the Cloudflare/Vinext application at the repository
 * root. It reuses the owner console's source (vendored into src/shared by
 * scripts/sync-shared.mjs) but runs on Node, with no database, no Worker bindings and no
 * learner write path of any kind.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  /* This app is its own workspace root. Without this, Next walks up and can pick an unrelated
   * lockfile as the root, which would widen output tracing beyond this directory. */
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  // Every admin response is per-reviewer and must never be cached or shared.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
