import "dotenv/config";
import type { FullConfig } from "@playwright/test";

const DEFAULT_BASE_URL = "http://localhost:3000";

export default async function globalSetup(config: FullConfig): Promise<void> {
  if (process.env.SKIP_PREFLIGHT === "1") return;

  const configuredBaseURL = config.projects[0]?.use.baseURL;
  const baseURL =
    typeof configuredBaseURL === "string"
      ? configuredBaseURL
      : process.env.BASE_URL ?? DEFAULT_BASE_URL;

  try {
    const response = await fetch(baseURL, {
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
      `Unable to reach BASE_URL=${baseURL}\n` +
        "Start StayBridge before running acceptance tests, or set BASE_URL to a reachable deployment.\n" +
        `Preflight error: ${reason}`,
      { cause: error },
    );
  }
}
