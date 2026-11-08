import fs from "fs";
import path from "path";
import { range, periodOf, label, big } from "./periods.js";
import { getUser } from "./plex.js";
import { cacheSlideAssets, pool } from "./assets.js";
import {
  SLIDE_ORDER,
  SKIP_BY_PERIOD,
  LIMITS,
  DEFAULT_MINUTES,
  RANKED,
  PERSONALITIES,
  FALLBACK_PERSONALITY,
} from "./slides.config.js";

const { PLEX_URL, PLEX_TOKEN } = process.env;
const DATA = path.resolve(process.env.DATA_DIR || "data/rewinds");
const sum = (a) => a.reduce((x, y) => x + y, 0);
const clip = (p, kind) => p && { path: p, kind };

async function plex(url, accept = "*/*") {
  const r = await fetch(url, {
    headers: { Accept: accept, "X-Plex-Token": PLEX_TOKEN },
    signal: AbortSignal.timeout(30000),
  });
  if (!r.ok)
    throw new Error(
      `Plex answered ${r.status} for ${new URL(url).pathname} (check PLEX_TOKEN)`,
    );
  return r;
}

const get = async (p) =>
  (await (await plex(PLEX_URL + p, "application/json")).json()).MediaContainer;

async function loadUsers() {
  const attr = (s, n) => s.match(new RegExp(`${n}="([^"]*)"`))?.[1] ?? "";
  const machineId = attr(
    await (await plex(`${PLEX_URL}/identity`)).text(),
    "machineIdentifier",
  );
  if (!machineId)
    throw new Error(
      "Could not find machineIdentifier in Plex identity response",
    );
  const xml = await (
    await plex(
      `https://plex.tv/api/servers/${machineId}/shared_servers`,
      "application/json",
    )
  ).text();
  const users = new Map();
  for (const [, attrs] of xml.matchAll(/<SharedServer\b([^>]*)\/?>/g)) {
    const id = attr(attrs, "userID"),
      name = attr(attrs, "username").trim();
    if (id && name && name.toLowerCase() !== "guest") users.set(id, name);
  }
  const me = await getUser(PLEX_TOKEN);
  if (!me.id)
    throw new Error("Could not look up the server owner from PLEX_TOKEN");
  users.set(String(me.id), me.username);
  return { owner: String(me.id), users };
}

const EMPTY = { min: 0, genres: [] };
function metadataLoader() {
  const cache = new Map();
  return (k) => {
    if (!k) return EMPTY;
    if (!cache.has(k))
      cache.set(
        k,
        get(`/library/metadata/${k}`)
          .then((m) => {
            const x = m.Metadata?.[0] ?? {};
            return {
              min: (x.duration || 0) / 6e4,
              genres: (x.Genre ?? []).map((g) => g.tag),
              part: x.Media?.[0]?.Part?.[0]?.key,
              theme: x.grandparentTheme,
              thumb: x.thumb,
              gthumb: x.grandparentThumb,
              pthumb: x.parentThumb,
            };
          })
          .catch(() => EMPTY),
      );
    return cache.get(k);
  };
}

const genreKey = (h) =>
  h.type === "movie" ? h.ratingKey : h.grandparentRatingKey;

function bump(map, key, min, extra) {
  const x = map.get(key) ?? { plays: 0, min: 0 };
  x.plays++;
  x.min += min;
  for (const p in extra) if (extra[p] && !x[p]) x[p] = extra[p];
  map.set(key, x);
}

async function collect(plays, info) {
  const s = {
    T: {
      movie: new Map(),
      show: new Map(),
      artist: new Map(),
      track: new Map(),
      screenGenre: new Map(),
      musicGenre: new Map(),
    },
    mins: { movie: 0, episode: 0, track: 0 },
    months: Array(12).fill(0),
    hrs: Array(24).fill(0),
    days: Array(7).fill(0),
    binge: {},
  };
  for (const h of plays) {
    const i = await info(h.ratingKey),
      min = i.min || DEFAULT_MINUTES[h.type],
      t = new Date(h.viewedAt * 1000);
    s.mins[h.type] += min;
    s.months[t.getUTCMonth()] += min / 60;
    s.hrs[t.getUTCHours()] += min;
    s.days[t.getUTCDay()] += min;
    if (h.type === "movie")
      bump(s.T.movie, h.title, min, { thumb: i.thumb || h.thumb });
    else if (h.type === "episode") {
      bump(s.T.show, h.grandparentTitle, min, {
        thumb: i.gthumb || h.grandparentThumb,
        theme: i.theme,
      });
      const day = `${t.toISOString().slice(0, 10)}|${h.grandparentTitle}`;
      s.binge[day] = (s.binge[day] ?? 0) + 1;
    } else {
      bump(s.T.artist, h.grandparentTitle, min, {
        thumb: i.gthumb || h.grandparentThumb,
      });
      bump(s.T.track, `${h.title} — ${h.grandparentTitle}`, min, {
        thumb: i.pthumb || h.parentThumb,
        part: i.part,
        artist: h.grandparentTitle,
      });
    }
    const parentGenres = (await info(genreKey(h))).genres;
    for (const g of parentGenres.length ? parentGenres : i.genres)
      bump(h.type === "track" ? s.T.musicGenre : s.T.screenGenre, g, min);
  }
  s.total = sum(Object.values(s.mins));
  s.hours = Math.round(s.total / 60);
  return s;
}

const AUDIO = {
  theme: (s, name, v) => clip(v.theme, "theme"),
  song: (s, name, v) => clip(v.part, "song"),
  topSong: (s, name) =>
    clip(
      [...s.T.track.values()]
        .filter((t) => t.artist === name && t.part)
        .sort((x, y) => y.plays - x.plays)[0]?.part,
      "song",
    ),
};

function ranked(s, def) {
  const top = [...s.T[def.from]]
    .sort((x, y) => y[1].min - x[1].min)
    .slice(0, LIMITS.topItems);
  if (top.length < LIMITS.minItems) return null;
  return {
    type: "ranks",
    title: def.title,
    unit: def.unit,
    items: top.map(([name, v]) => ({ name, plays: v.plays, thumb: v.thumb })),
    audio: def.audio && AUDIO[def.audio](s, ...top[0]),
  };
}

function persona(s) {
  const share = (a) => sum(a) / s.total;
  const m = {
    binge: Math.max(0, ...Object.values(s.binge)),
    night: share([...s.hrs.slice(22), ...s.hrs.slice(0, 4)]),
    early: share(s.hrs.slice(5, 10)),
    weekend: (s.days[0] + s.days[6]) / s.total,
    music: s.mins.track / s.total,
    movie: s.mins.movie / s.total,
  };
  const hit =
      PERSONALITIES.find((p) => m[p.metric] >= p.atLeast) ??
      FALLBACK_PERSONALITY,
    pct = (x) => `${Math.round(x * 100)}%`;
  return {
    type: "personality",
    title: hit.title,
    line: hit.line,
    traits: [
      hit.trait,
      `${pct(m.night)} after dark`,
      `${pct(m.weekend)} on weekends`,
    ],
  };
}

const hourAt = (h) => new Date(Date.UTC(2024, 0, 1, h)).toISOString();

const makers = {
  ...Object.fromEntries(
    Object.entries(RANKED).map(([id, def]) => [id, (s) => ranked(s, def)]),
  ),
  intro: (s, c) => ({
    type: "intro",
    big: big(c.key),
    label: label(c.key),
    name: s.name,
  }),
  hours: (s) => ({
    type: "hours",
    total: s.hours,
    split: {
      Movies: Math.round(s.mins.movie / 60),
      TV: Math.round(s.mins.episode / 60),
      Music: Math.round(s.mins.track / 60),
    },
  }),
  binge(s) {
    const best = Object.entries(s.binge).sort((x, y) => y[1] - x[1])[0];
    if (!best || best[1] < LIMITS.minBinge) return null;
    const cut = best[0].indexOf("|"),
      show = best[0].slice(cut + 1),
      item = s.T.show.get(show);
    return {
      type: "binge",
      show,
      episodes: best[1],
      date: new Date(best[0].slice(0, cut)).toLocaleDateString("en", {
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }),
      thumb: item?.thumb,
      audio: clip(item?.theme, "theme"),
    };
  },
  peak(s) {
    const mx = Math.max(...s.hrs);
    return {
      type: "peak",
      day: new Date(
        Date.UTC(2024, 0, 7 + s.days.indexOf(Math.max(...s.days))),
      ).toISOString(),
      hour: hourAt(s.hrs.indexOf(mx)),
      hours: s.hrs.map((n, h) => ({
        time: hourAt(h),
        count: Math.round((n / mx) * 100),
      })),
    };
  },
  months: (s) => ({ type: "months", values: s.months.map(Math.round) }),
  personality: (s) => persona(s),
  percent(s, c) {
    if (c.order.length < LIMITS.minUsers) return null;
    const rank = c.order.indexOf(s) + 1;
    return {
      type: "percent",
      pct: Math.max(1, Math.ceil((rank / c.order.length) * 100)),
      rank,
      of: c.order.length,
    };
  },
};

export async function build(key, { skip = [], only = [] } = {}) {
  const period = periodOf(key),
    [from, to] = range(key),
    off = new Set([...SKIP_BY_PERIOD[period], ...skip]);
  const wanted = (id) => !off.has(id) && (!only.length || only.includes(id));
  console.log(`Fetching history from ${PLEX_URL} ...`);
  const hist =
    (
      await get(
        `/status/sessions/history/all?viewedAt%3E=${from / 1e3}&viewedAt%3C=${to / 1e3}&X-Plex-Container-Size=100000`,
      )
    ).Metadata ?? [];
  const { owner, users } = await loadUsers();

  const byUser = {};
  for (const h of hist) {
    const uid = String(h.accountID) === "1" ? owner : String(h.accountID);
    if (users.has(uid) && DEFAULT_MINUTES[h.type]) (byUser[uid] ??= []).push(h);
  }
  const all = Object.values(byUser).flat();
  console.log(
    `${all.length} plays from ${Object.keys(byUser).length} active accounts`,
  );

  const info = metadataLoader(),
    keys = new Set(all.flatMap((h) => [h.ratingKey, genreKey(h)]));
  keys.delete(undefined);
  let done = 0;
  await pool(keys, 8, async (k) => {
    await info(k);
    if (++done % 100 === 0) console.log(`  loaded metadata for ${done} items`);
  });

  const stats = [];
  for (const [uid, plays] of Object.entries(byUser))
    stats.push({ uid, name: users.get(uid), ...(await collect(plays, info)) });
  const ctx = { key, order: [...stats].sort((x, y) => y.total - x.total) },
    built = [];

  for (const s of stats) {
    const slides = SLIDE_ORDER.filter(wanted)
      .map((id) => {
        const sl = makers[id]?.(s, ctx);
        return sl && { id, ...sl };
      })
      .filter(Boolean);
    await cacheSlideAssets(slides);
    fs.mkdirSync(path.join(DATA, s.uid), { recursive: true });
    fs.writeFileSync(
      path.join(DATA, s.uid, `${key}.json`),
      JSON.stringify(
        {
          key,
          period,
          big: big(key),
          label: label(key),
          summary: { hours: s.hours },
          slides,
        },
        null,
        1,
      ),
    );
    built.push({ uid: s.uid, hours: s.hours, key });
  }
  return built;
}
