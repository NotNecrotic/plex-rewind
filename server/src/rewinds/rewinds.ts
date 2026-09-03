import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export interface RewindSummary {
  id: string;
  year: number;
  title: string;
  liveDate: string;
  serverName: string | null;
  userCount: number;
}

export function isRewindLive(liveDate: string): boolean {
  if (!liveDate) return true;
  const date = Date.parse(liveDate);
  if (Number.isNaN(date)) return true;
  return date <= Date.now();
}

function rewindsRoot(): string {
  const configured = process.env.REWINDS_DIR;
  const fallback = path.resolve(process.cwd(), "..", "builder", "output");
  return path.resolve(configured ?? fallback);
}

export function rewindsRootPath(): string {
  return rewindsRoot();
}

function rewindDir(id: string): string {
  return path.join(rewindsRoot(), id);
}

function rewindConfigFile(id: string): string {
  return path.join(rewindDir(id), "config.json");
}

function rewindUsersDir(id: string): string {
  return path.join(rewindDir(id), "users");
}

async function tryReadJson(
  file: string,
): Promise<Record<string, unknown> | null> {
  try {
    const text = await readFile(file, "utf8");
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function countUserRewinds(id: string): Promise<number> {
  let files: string[];
  try {
    files = await readdir(rewindUsersDir(id));
  } catch {
    return 0;
  }
  return files.filter((file) => file.endsWith(".json")).length;
}

export async function listAvailableRewinds(): Promise<RewindSummary[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await readdir(rewindsRoot(), { withFileTypes: true });
  } catch {
    return [];
  }

  const summaries: RewindSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const config = await tryReadJson(rewindConfigFile(entry.name));
    if (!config || typeof config.year !== "number") continue;

    summaries.push({
      id: entry.name,
      year: config.year,
      title:
        typeof config.title === "string"
          ? config.title
          : `Your ${config.year} Rewind`,
      liveDate: typeof config.liveDate === "string" ? config.liveDate : "",
      serverName:
        typeof config.serverName === "string" ? config.serverName : null,
      userCount: await countUserRewinds(entry.name),
    });
  }

  return summaries.sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
}

export async function listRewindUserIds(id: string): Promise<number[]> {
  let files: string[];
  try {
    files = await readdir(rewindUsersDir(id));
  } catch {
    return [];
  }

  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => Number(path.basename(file, ".json")))
    .filter((value) => Number.isFinite(value));
}

export async function getUserRewind(
  id: string,
  userId: number,
): Promise<Record<string, unknown> | null> {
  const file = path.join(rewindUsersDir(id), `${userId}.json`);
  return tryReadJson(file);
}

export async function getServerIdentity(): Promise<{ name: string | null }> {
  const rewinds = await listAvailableRewinds();

  for (const rewind of rewinds) {
    if (rewind.serverName) {
      return { name: rewind.serverName };
    }
  }

  return { name: null };
}
