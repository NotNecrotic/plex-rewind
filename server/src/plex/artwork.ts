const PLEX_URL = process.env.PLEX_URL ?? "";
const PLEX_TOKEN = process.env.PLEX_TOKEN ?? "";

export function isSafeArtworkPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  if (path.includes("?") || path.includes("#")) return false;
  return true;
}

export async function fetchArtwork(
  artworkPath: string,
): Promise<{ contentType: string; body: ArrayBuffer }> {
  if (!PLEX_URL || !PLEX_TOKEN) {
    throw new Error(
      "PLEX_URL and PLEX_TOKEN must be configured to proxy artwork.",
    );
  }

  const url = `${PLEX_URL.replace(/\/$/, "")}${artworkPath}?X-Plex-Token=${encodeURIComponent(PLEX_TOKEN)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Plex artwork request failed: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";

  return { contentType, body: await response.arrayBuffer() };
}
