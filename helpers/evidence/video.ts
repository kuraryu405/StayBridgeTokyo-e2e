import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import type { Page } from "@playwright/test";
import { EVIDENCE_ROOT, safeSegment } from "./metadata";

const execFileAsync = promisify(execFile);

/**
 * Returns the final meaningful destination used by the evidence reporter.
 * Video files only become complete after the browser context closes, so the
 * reporter performs the actual conversion and copy in onTestEnd rather than
 * blocking a test.
 */
export function videoDestination(scenario: string, name?: string): string {
  const safeScenario = safeSegment(scenario);
  return path.join(
    EVIDENCE_ROOT,
    "videos",
    safeScenario,
    `${safeSegment(name ?? safeScenario)}.mp4`,
  );
}

/**
 * Playwright records Chromium video as WebM. Convert it to a broadly playable
 * H.264 MP4 for the final evidence bundle.
 */
export async function convertVideoToMp4(source: string, destination: string): Promise<void> {
  const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
  try {
    await execFileAsync(ffmpeg, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      source,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      destination,
    ]);
  } catch (error: unknown) {
    const details =
      typeof error === "object" && error !== null
        ? (error as { code?: string; message?: string; stderr?: string })
        : undefined;
    if (details?.code === "ENOENT") {
      throw new Error(
        "MP4 evidence video conversion requires FFmpeg. Install it locally (for example, `brew install ffmpeg`) or set FFMPEG_PATH.",
      );
    }
    throw new Error(
      `FFmpeg could not convert evidence video: ${details?.stderr?.trim() || details?.message || String(error)}`,
    );
  }
}

export function hasRecordedVideo(page: Page): boolean {
  return page.video() !== null;
}
