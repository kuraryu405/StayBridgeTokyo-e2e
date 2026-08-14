import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const EVIDENCE_ROOT = path.resolve(process.cwd(), "evidence");

export function safeSegment(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "evidence"
  );
}

export async function writeMetadata(
  scenario: string,
  name: string,
  value: Record<string, unknown>,
): Promise<string> {
  const directory = path.join(EVIDENCE_ROOT, "metadata", safeSegment(scenario));
  await mkdir(directory, { recursive: true });
  const destination = path.join(directory, `${safeSegment(name)}.json`);
  await writeFile(destination, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return destination;
}
