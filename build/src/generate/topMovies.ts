import type { TautulliHistoryItem } from "../collectors/tautulli.js";
import { config } from "../config/env.js";

export interface TopMovieEntry {
  rank: number;
  ratingKey: number | null;
  title: string;
  year: number | null;
  plays: number;
  thumb: string | null;
}

export interface TopMoviesScene {
  movies: TopMovieEntry[];
  background: string | null;
}

async function getMovieArt(ratingKey: number): Promise<string | null> {
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

export async function generateTopMovies(
  history: TautulliHistoryItem[],
  userId: number,
  limit = 10,
): Promise<TopMoviesScene> {
  const grouped = new Map<number, TopMovieEntry>();
  console.log(history.length, "history items for user", userId);

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
        thumb: item.thumb ?? null,
      };
      grouped.set(key, entry);
    }

    if (item.watched_status === 1) {
      entry.plays += 1;
    }

    if (item.title) entry.title = item.title;
    if (item.year) entry.year = item.year;
    if (item.thumb) entry.thumb = item.thumb;
  }

  const movies = Array.from(grouped.values())
    .sort((a, b) => b.plays - a.plays)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return {
    background: movies[0]?.ratingKey
      ? await getMovieArt(movies[0].ratingKey)
      : null,
    movies,
  };
}
