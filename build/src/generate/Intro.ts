import type { TautulliHistoryItem } from "../collectors/tautulli.js";

export interface IntroData {
  thumbnails: string[];
}

interface ThumbnailEntry {
  groupKey: string;
  thumb: string;
  watchCount: number;
  lastWatched: number;
}

export function generateIntro(
  history: TautulliHistoryItem[],
  userId: number,
  limit = 32,
): IntroData {
  const grouped = new Map<string, ThumbnailEntry>();

  for (const item of history) {
    if (Number(item.user_id) !== userId) continue;

    if (item.media_type !== "movie" && item.media_type !== "episode") {
      continue;
    }

    const ratingKey = Number(item.rating_key);

    if (!Number.isFinite(ratingKey)) continue;
    if (!item.thumb) continue;

    const groupKey =
      item.media_type === "movie"
        ? `movie:${ratingKey}`
        : `show:${item.grandparent_rating_key}`;

    if (item.media_type === "episode" && !item.grandparent_rating_key) {
      continue;
    }

    let entry = grouped.get(groupKey);

    if (!entry) {
      entry = {
        groupKey,
        thumb: item.thumb,
        watchCount: 0,
        lastWatched: 0,
      };

      grouped.set(groupKey, entry);
    }

    entry.watchCount += 1;

    if (item.thumb) {
      entry.thumb = item.thumb;
    }

    const timestamp = Number(item.stopped);

    if (Number.isFinite(timestamp)) {
      entry.lastWatched = Math.max(entry.lastWatched, timestamp);
    }
  }

  const thumbnails = Array.from(grouped.values())
    .sort(
      (a, b) => b.watchCount - a.watchCount || b.lastWatched - a.lastWatched,
    )
    .slice(0, limit)
    .map((entry) => entry.thumb);

  return {
    thumbnails,
  };
}
