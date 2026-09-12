import type { TautulliHistoryItem } from "../collectors/tautulli.js";
import { config } from "../config/env.js";
import { getItemArt } from "./helper.js";

export interface TopShowEntry {
  rank: number;
  ratingKey: number | null;
  title: string;
  year: number | null;
  episodes: number;
  seasons: number;
  thumb: string | null;
}

export interface TopShowsScene {
  shows: TopShowEntry[];
  background: string | null;
  totalShows: number;
  totalEpisodes: number;
}

async function getShowThumb(ratingKey: number): Promise<string | null> {
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

  return data.MediaContainer?.Metadata?.[0]?.grandparentThumb ?? null;
}

export async function generateTopShows(
  history: TautulliHistoryItem[],
  userId: number,
  limit = 5,
): Promise<TopShowsScene> {
  const grouped = new Map<number, TopShowEntry & { seasonKeys: Set<number> }>();

  for (const item of history) {
    if (item.media_type !== "episode") continue;
    if (Number(item.user_id) !== userId) continue;
    if (item.watched_status !== 1) continue;

    const key = Number(item.grandparent_rating_key);
    if (!Number.isFinite(key)) continue;

    const showThumb = await getShowThumb(Number(item.rating_key));

    let entry = grouped.get(key);

    if (!entry) {
      entry = {
        rank: 0,
        ratingKey: key,
        title: item.grandparent_title ?? item.title,
        year: item.year ?? null,
        episodes: 0,
        seasons: 0,
        thumb: showThumb,
        seasonKeys: new Set<number>(),
      };

      grouped.set(key, entry);
    }

    entry.episodes += 1;

    const seasonKey = Number(item.parent_rating_key);

    if (Number.isFinite(seasonKey)) {
      entry.seasonKeys.add(seasonKey);
      entry.seasons = entry.seasonKeys.size;
    }

    if (item.year) entry.year = item.year;
    if (item.grandparent_title) {
      entry.title = item.grandparent_title;
    }
    if (showThumb) {
      entry.thumb = showThumb;
    }
  }

  const totalShows = grouped.size;
  const totalEpisodes = Array.from(grouped.values()).reduce(
    (total, show) => total + show.episodes,
    0,
  );

  const shows = Array.from(grouped.values())
    .sort((a, b) => b.episodes - a.episodes)
    .slice(0, limit)
    .map(({ seasonKeys, ...entry }, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return {
    background: shows[0]?.ratingKey
      ? await getItemArt(shows[0].ratingKey)
      : null,
    shows,
    totalShows,
    totalEpisodes,
  };
}
