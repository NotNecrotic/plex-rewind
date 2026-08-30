import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { join } from "node:path";
import { config } from "./env.js";
import { env } from "node:process";

export interface RewindConfig {
  id: string;
  year: number;
  title: string;
  scenes: string[];
  startDate: string;
  endDate: string;
  liveDate: string;
  serverName?: string;
  createdAt: string;
  updatedAt: string;
}

export function buildDir(): string {
  return config.BUILD_DIR;
}

export async function loadConfig(id: string): Promise<RewindConfig | null> {
  let config: string;

  try {
    config = await readFile(join(buildDir(), id), "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      return null;
    }
    throw error;
  }

  try {
    return JSON.parse(config) as RewindConfig;
  } catch {
    throw new Error(`Invalid config file: ${join(buildDir(), id)}`);
  }
}

export async function saveConfig(
  rewindConfig: RewindConfig,
  id: string,
): Promise<void> {
  const targetDir = path.join(buildDir(), id);
  const configPath = path.join(targetDir, "config.json");
  await mkdir(targetDir, { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify(rewindConfig, null, 2)}\n`,
    "utf8",
  );
}
