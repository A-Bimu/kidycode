import type { NextConfig } from "next";

/*
 * The Vercel review target's Next configuration.
 *
 * This app is deliberately separate from the Cloudflare/Vinext application at the repository
 * root. It reuses the owner console's source (vendored into src/shared by
 * scripts/sync-shared.mjs) but runs on Node, with no database, no Worker bindings and no
 * learner write path of any kind.
 *
 * Deliberately absent: `turbopack.root` and `outputFileTracingRoot`.
 *
 * Setting either to `process.cwd()` makes Next report the app directory as the project root,
 * so Vercel's post-build finalizer resolves the deployment's traced-file manifest one
 * directory too high — `/vercel/path0/.next/...` instead of
 * `/vercel/path0/admin-preview/.next/...` — and fails an otherwise successful build with
 * `ENOENT ... routes-manifest-deterministic.json`. That is the known Next.js 16 + multi-segment
 * Root Directory finalization bug (vercel/vercel and Vercel Community reports of the same
 * ENOENT). Left unset, Next walks up from the app directory, finds the repository lockfile, and
 * derives the correct nested app path, so Vercel looks in the right place.
 *
 * Do not reintroduce either key to silence the local "multiple lockfiles" warning: it is a
 * warning only, and the workaround breaks the Git deployment.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
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
