import type { TautulliHistoryItem } from "../collectors/tautulli.js";
import { historySeconds } from "./helper.js";

export interface TopMovieEntry {
  rank: number;
  ratingKey: number | null;
  title: string;
  year: number | null;
  plays: number;
  watchTimeSeconds: number;
  moviePercentage: number | null;
  thumb: string | null;
}

export function generateTopMovies(
  history: TautulliHistoryItem[],
  userId: number,
  limit = 10,
): TopMovieEntry[] {
  const grouped = new Map<number, TopMovieEntry>();
  console.log(history.length, "history items for user", userId);
  let totalMovieWatchTime = 0;

  for (const item of history) {
    if (item.media_type !== "movie") continue;
    if (Number(item.user_id) !== userId) continue;

    const key = Number(item.rating_key);
    if (!Number.isFinite(key)) continue;

    const watchTime = historySeconds(item);
    totalMovieWatchTime += watchTime;

    let entry = grouped.get(key);
    if (!entry) {
      entry = {
        rank: 0,
        ratingKey: key,
        title: item.title,
        year: item.year,
        plays: 0,
        watchTimeSeconds: 0,
        moviePercentage: null,
        thumb: item.thumb ?? null,
      };
      grouped.set(key, entry);
    }

    if (item.watched_status === 1) {
      entry.plays += 1;
    }

    entry.watchTimeSeconds += watchTime;

    if (item.title) entry.title = item.title;
    if (item.year) entry.year = item.year;
    if (item.thumb) entry.thumb = item.thumb;
  }

  for (const entry of grouped.values()) {
    entry.moviePercentage =
      totalMovieWatchTime > 0
        ? (entry.watchTimeSeconds / totalMovieWatchTime) * 100
        : null;
  }

  return Array.from(grouped.values())
    .sort(
      (a, b) =>
        b.plays - a.plays ||
        (b.moviePercentage ?? 0) - (a.moviePercentage ?? 0),
    )
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
