import "dotenv/config";
import type { FullConfig } from "@playwright/test";
import { MUNICIPALITY_URL, USER_URL } from "./targets";

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (process.env.SKIP_PREFLIGHT === "1") return;

  const targets = Array.from(
    new Set(
      config.projects
        .map((project) => project.use.baseURL)
        .filter((value): value is string => typeof value === "string"),
    ),
  );

  for (const target of targets.length ? targets : [USER_URL, MUNICIPALITY_URL]) {
    try {
      const response = await fetch(target, {
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
        headers: { "user-agent": "staybridge-acceptance-preflight/1.0" },
      });

      if (response.status >= 500) {
        throw new Error(`Target returned HTTP ${response.status}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Unable to reach target URL=${target}\n` +
          "Start both StayBridge deployments before running acceptance tests, or set BASE_URL and MUNICIPALITY_URL to reachable deployments.\n" +
          `Preflight error: ${reason}`,
        { cause: error },
      );
    }
  }
}
