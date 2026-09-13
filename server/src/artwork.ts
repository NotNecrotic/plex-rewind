import path from "node:path";
import { readFile } from "node:fs/promises";

const REWINDS_DIR = process.env.REWINDS_DIR ?? "../build/builds";

export async function fetchArtwork(
  year: string,
  asset: string,
): Promise<{ contentType: string; body: Buffer }> {
  if (asset.includes("/") || asset.includes("\\") || asset.includes("..")) {
    throw new Error("Invalid asset filename");
  }

  const extension = path.extname(asset).toLowerCase();

  const assetType = extension === ".mp3" ? "audio" : "images";

  const assetPath = path.resolve(REWINDS_DIR, year, "assets", assetType, asset);

  const buildsRoot = path.resolve(REWINDS_DIR);

  if (!assetPath.startsWith(buildsRoot + path.sep)) {
    throw new Error("Invalid asset path");
  }

  const body = await readFile(assetPath);

  const contentType = extension === ".mp3" ? "audio/mpeg" : "image/jpeg";

  return {
    contentType,
    body,
  };
}
