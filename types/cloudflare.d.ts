interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB: D1Database;
    ASSETS: Fetcher;
    IMAGES: {
      input(stream: ReadableStream): {
        transform(options: Record<string, unknown>): {
          output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
        };
      };
    };
    /* Identity trust configuration. Both are optional: with neither set, the deployment is
     * in the documented platform-header mode; a secret switches the institution routes to
     * the signed proxy mode. */
    KIDYCODE_IDENTITY_SECRET?: string;
    KIDYCODE_IDENTITY_TRUST?: string;
    /* The explicit owner allowlist for the platform admin console. Platform-wide owner
     * access is granted to these platform user ids only, and only when the identity they
     * arrive with carries a valid edge signature. */
    KIDYCODE_ADMIN_USER_IDS?: string;
    /* Synthetic review mode. Off unless the deployment sets this to exactly "1". It lets
     * the owner open the console for a local or review demonstration while no signing edge
     * and no owner account are configured. It also needs KIDYCODE_ADMIN_REVIEW_KEY, so a
     * demonstration deployment is never open to a stranger who only knows the URL. Every
     * response it produces is labelled synthetic, and it refuses to activate when a real
     * signature secret is configured. */
    KIDYCODE_ADMIN_REVIEW_DEMO?: string;
    /* The value a caller must present to open a synthetic review session (at least 16
     * characters). Not a substitute for real owner authentication: it exists so a review
     * deployment can be reached without publishing the console. */
    KIDYCODE_ADMIN_REVIEW_KEY?: string;
  };
}
