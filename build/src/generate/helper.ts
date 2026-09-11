import type { TautulliHistoryItem } from "../collectors/tautulli.js";
import { config } from "../config/env.js";

export function historySeconds(item: TautulliHistoryItem): number {
  const watched = Number(item.duration);
  if (Number.isFinite(watched) && watched > 0) {
    return watched;
  }
  const total = Number(item.duration);
  return Number.isFinite(total) && total > 0 ? total : 0;
}

export async function getItemArt(ratingKey: number): Promise<string | null> {
  const response = await fetch(
    `${config.PLEX_URL}/library/metadata/${ratingKey}?X-Plex-Token=${config.PLEX_TOKEN}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) return null;

  const data = await response.json();

  return data.MediaContainer?.Metadata?.[0]?.art ?? null;
}
