import type { TautulliHistoryItem } from "../collectors/tautulli.js";
import { historySeconds } from "./helper.js";

export interface TopMovieEntry {
  rank: number;
  ratingKey: number | null;
  title: string;
  year: number | null;
  plays: number;
  watchTimeSeconds: number;
  thumb: string | null;
}

export function generateTopMovies(
  history: TautulliHistoryItem[],
  userId: number,
  limit = 10,
): TopMovieEntry[] {
  const grouped = new Map<number, TopMovieEntry>();

  for (const item of history) {
    if (item.media_type !== "movie") continue;
    if (Number(item.user_id) !== userId) continue;

    const key = Number(item.rating_key);
    if (!Number.isFinite(key)) continue;

    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        rank: 0,
        ratingKey: key,
        title: item.title,
        year: item.year,
        plays: 0,
        watchTimeSeconds: 0,
        thumb: item.thumb ?? null,
      };
      grouped.set(key, entry);
    }

    entry.plays += 1;
    entry.watchTimeSeconds += historySeconds(item);
    if (item.title) entry.title = item.title;
    if (item.year) entry.year = item.year;
    if (item.thumb) entry.thumb = item.thumb;
  }

  return Array.from(grouped.values())
    .sort(
      (a, b) => b.plays - a.plays || b.watchTimeSeconds - a.watchTimeSeconds,
    )
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
