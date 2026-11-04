import vinext from "vinext";
import { defineConfig } from "vite";

/**
 * Independent Cloudflare Workers build — no ChatGPT Sites plugin.
 * A separate staging D1 binding is mandatory before real deployment.
 * The all-zero value is for isolated local/CI builds only, never production.
 */
const EMPTY_ID = "00000000-0000-4000-8000-000000000000";
const databaseId = process.env.KIDYCODE_STAGING_D1_ID ?? EMPTY_ID;

if (process.env.KIDYCODE_WORKERS_DEPLOY === "1" && databaseId === EMPTY_ID) {
  throw new Error("Provide a dedicated staging D1 database ID before deploying.");
}

export default defineConfig(async () => {
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return {
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          main: "./worker/index.ts",
          compatibility_flags: ["nodejs_compat"],
          d1_databases: [{
            binding: "DB",
            database_name: "kidycode-staging",
            database_id: databaseId,
          }],
          assets: { binding: "ASSETS", not_found_handling: "none" },
          images: { binding: "IMAGES" },
        },
      }),
    ],
  };
});
