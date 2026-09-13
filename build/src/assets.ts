import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { config } from "./config/env.js";

type AssetType = "image" | "audio";

interface AssetDefinition {
  type: AssetType;
  keys: readonly string[];
  extension: string;
  directory: string;
}

const ASSET_DEFINITIONS: readonly AssetDefinition[] = [
  {
    type: "image",
    keys: ["thumb", "poster", "avatar", "background"],
    extension: ".jpg",
    directory: "images",
  },
  { type: "audio", keys: ["theme"], extension: ".mp3", directory: "audio" },
];

const KEY_MAPPINGS = new Map(
  ASSET_DEFINITIONS.flatMap((definition) =>
    definition.keys.map((key) => [key, definition] as const),
  ),
);

interface AssetReference {
  source: string;
  type: AssetType;
}

function collectAssets(
  json: unknown,
  assets: Map<string, AssetReference>,
): void {
  if (Array.isArray(json)) {
    for (const item of json) {
      collectAssets(item, assets);
    }
    return;
  }
  if (!json || typeof json !== "object") {
    return;
  }
  for (const [key, value] of Object.entries(json)) {
    const definition = KEY_MAPPINGS.get(key);
    if (definition && typeof value === "string" && value.length > 0) {
      assets.set(value, { source: value, type: definition.type });
    } else if (key === "thumbnails" && Array.isArray(value)) {
      for (const thumbnail of value) {
        if (typeof thumbnail === "string" && thumbnail.length > 0) {
          assets.set(thumbnail, { source: thumbnail, type: "image" });
        }
      }
    }
    collectAssets(value, assets);
  }
}

async function downloadAsset(source: string): Promise<Buffer | null> {
  let url: string;
  if (/^https?:\/\//i.test(source)) {
    url = source;
  } else if (source.startsWith("/")) {
    url = `${config.PLEX_URL.replace(/\/$/, "")}${source}?X-Plex-Token=${encodeURIComponent(config.PLEX_TOKEN)}`;
  } else {
    return null;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function rewriteUrls(json: unknown, mapping: Map<string, string>): unknown {
  if (Array.isArray(json)) {
    return json.map((item) => rewriteUrls(item, mapping));
  }
  if (!json || typeof json !== "object") {
    return json;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(json)) {
    const definition = KEY_MAPPINGS.get(key);
    if (definition && typeof value === "string" && mapping.has(value)) {
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

export async function generateAssets(rewindDir: string): Promise<number> {
  const assetsDir = path.join(rewindDir, "assets");
  await mkdir(assetsDir, { recursive: true });
  const files = (await readdir(path.join(rewindDir, "users"))).filter((file) =>
    file.endsWith(".json"),
  );
  const assets = new Map<string, AssetReference>();
  for (const file of files) {
    const json: unknown = JSON.parse(
      await readFile(path.join(rewindDir, "users", file), "utf-8"),
    );
    collectAssets(json, assets);
  }
  if (assets.size === 0) {
    return 0;
  }
  const mapping = new Map<string, string>();
  for (const asset of assets.values()) {
    const hash = createHash("sha256").update(asset.source).digest("hex");
    const definition = ASSET_DEFINITIONS.find(
      (item) => item.type === asset.type,
    );
    if (!definition) {
      continue;
    }
    const buffer = await downloadAsset(asset.source);
    if (!buffer) {
      continue;
    }
    const fileName = `${hash}${definition.extension}`;
    const relativePath = fileName;
    const outputDir = path.join(assetsDir, definition.directory);
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, fileName), buffer);
    mapping.set(asset.source, relativePath.replaceAll("\\", "/"));
  }
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
  return mapping.size;
}
