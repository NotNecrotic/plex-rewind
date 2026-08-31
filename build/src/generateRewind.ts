import { config } from "./config/env.js";
import { join } from "node:path";
import path from "node:path";

export async function generateRewind(id: number): Promise<void> {
  const rewindDir = join(config.BUILD_DIR, id.toString());
  const configPath = path.join(rewindDir, "config.json");
}
