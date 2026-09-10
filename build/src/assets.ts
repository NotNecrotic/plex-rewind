import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config/env.js";

function collectUrls(json: unknown, urls: Set<string>): void {
  if (Array.isArray(json)) {
    for (const item of json) {
      collectUrls(item, urls);
    }

    return;
  }

  if (json && typeof json === "object") {
    for (const [key, value] of Object.entries(json)) {
      if (
        (key === "thumb" ||
          key === "poster" ||
          key === "avatar" ||
          key === "background") &&
        typeof value === "string" &&
        value.length > 0
      ) {
        urls.add(value);
      } else if (key === "thumbnails" && Array.isArray(value)) {
        for (const thumbnail of value) {
          if (typeof thumbnail === "string" && thumbnail.length > 0) {
            urls.add(thumbnail);
          }
        }
      }

      collectUrls(value, urls);
    }
  }
}

async function downloadAsset(source: string): Promise<Buffer | null> {
  let url: string;

  if (/^https?:\/\//i.test(source)) {
    url = source;
  } else if (source.startsWith("/")) {
    // Relative Plex artwork path requires plex token.
    url = `${config.PLEX_URL.replace(/\/$/, "")}${source}?X-Plex-Token=${encodeURIComponent(config.PLEX_TOKEN)}`;
  } else {
    return null;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `  ! Asset download failed (${response.status}): ${source.slice(0, 80)}`,
      );
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.warn(
      `  ! Asset download error: ${source.slice(0, 80)} — ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}

function rewriteUrls(json: unknown, mapping: Map<string, string>): unknown {
  if (Array.isArray(json)) {
    return json.map((item) => rewriteUrls(item, mapping));
  }

  if (json && typeof json === "object") {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(json)) {
      if (
        (key === "thumb" ||
          key === "poster" ||
          key === "avatar" ||
          key === "background") &&
        typeof value === "string" &&
        mapping.has(value)
      ) {
        result[key] = mapping.get(value);
      } else if (key === "thumbnails" && Array.isArray(value)) {
        result[key] = value.map((thumbnail) =>
          typeof thumbnail === "string"
            ? (mapping.get(thumbnail) ?? thumbnail)
            : rewriteUrls(thumbnail, mapping),
        );
      } else {
        result[key] = rewriteUrls(value, mapping);
      }
    }

    return result;
  }

  return json;
}

export async function generateAssets(rewindDir: string): Promise<number> {
  const assetsDir = path.join(rewindDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  const files = (await readdir(path.join(rewindDir, "users"))).filter((file) =>
    file.endsWith(".json"),
  );

  const urls = new Set<string>();

  for (const file of files) {
    const json: unknown = JSON.parse(
      await readFile(path.join(rewindDir, "users", file), "utf-8"),
    );
    collectUrls(json, urls);
  }

  if (urls.size === 0) {
    console.log("No assets found.");
    return 0;
  }

  console.log(`\nCaching ${urls.size} artwork asset(s)`);

  const mapping = new Map<string, string>();

  for (const url of urls) {
    const hash = createHash("sha256").update(url).digest("hex");

    const buffer = await downloadAsset(url);

    if (!buffer) continue;

    const fileName = `${hash}.jpg`;
    await writeFile(path.join(assetsDir, fileName), buffer);
    mapping.set(url, fileName);
  }

  // Replace URLs in user JSON files with local asset paths
  for (const file of files) {
    const filePath = path.join(rewindDir, "users", file);
    const json = JSON.parse(await readFile(filePath, "utf8"));
    const rewritten = rewriteUrls(json, mapping);
    await writeFile(
      filePath,
      `${JSON.stringify(rewritten, null, 2)}\n`,
      "utf8",
    );
  }

  console.log(`  Cached ${mapping.size} asset(s) → ${assetsDir}`);

  return mapping.size;
}
