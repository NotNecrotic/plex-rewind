import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";

const { PLEX_URL, PLEX_TOKEN } = process.env;
const DATA = path.resolve(process.env.DATA_DIR || "data/rewinds");

const IMG_EXT = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const AUDIO_EXT = {
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/flac": ".flac",
  "audio/ogg": ".ogg",
  "audio/opus": ".opus",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/x-ms-wma": ".wma",
};

const KINDS = {
  artwork: {
    dir: "_artwork",
    accept: "image/*",
    idle: 30e3, // 30,000 ms (30 seconds)
    max: 15e6, // 15,000,000 bytes (15 MB)
    ext: IMG_EXT,
  },
  song: {
    dir: "_audio",
    accept: "audio/*",
    idle: 60e3, // 60,000 ms (1 minute)
    max: 100e6, // 100,000,000 bytes (100 MB)
    ext: AUDIO_EXT,
  },
  theme: {
    dir: "_audio",
    accept: "*/*",
    idle: 60e3, // 60,000 ms (1 minute)
    max: 100e6, // 100,000,000 bytes (100 MB)
    ext: ".mp3",
  },
};

for (const dir of new Set(Object.values(KINDS).map((k) => k.dir)))
  fs.mkdirSync(path.join(DATA, dir), { recursive: true });

const extsOf = (k) =>
  typeof k.ext === "string" ? [k.ext] : [...new Set(Object.values(k.ext))];
const inflight = new Map();

async function download(kind, url, hash) {
  const k = KINDS[kind],
    ctrl = new AbortController(),
    dir = path.join(DATA, k.dir);
  let idle, tmp;
  const alive = () => {
    clearTimeout(idle);
    idle = setTimeout(() => ctrl.abort(), k.idle);
  };
  try {
    alive();
    const r = await fetch(url, {
      headers: { Accept: k.accept, "X-Plex-Token": PLEX_TOKEN },
      signal: ctrl.signal,
    });
    const ext =
      typeof k.ext === "string"
        ? k.ext
        : k.ext[(r.headers.get("content-type") || "").split(";")[0].trim()];
    if (!r.ok || !ext) return void r.body?.cancel();
    let bytes = 0;
    const guard = new Transform({
      transform(chunk, _, done) {
        alive();
        bytes += chunk.length;
        done(bytes > k.max ? new Error("file too large") : null, chunk);
      },
    });
    tmp = path.join(dir, `${hash}${ext}.part`);
    await pipeline(Readable.fromWeb(r.body), guard, fs.createWriteStream(tmp));
    if (!bytes) throw new Error("empty response");
    fs.renameSync(tmp, path.join(dir, hash + ext));
    console.log(
      `[${kind}] cached ${hash}${ext} (${(bytes / 1e6).toFixed(1)} MB)`,
    );
    return hash + ext;
  } catch (e) {
    console.warn(
      `[${kind}] failed ${url.pathname}: ${ctrl.signal.aborted ? "no data received for " + k.idle / 1000 + "s" : e.message}`,
    );
    if (tmp) fs.rmSync(tmp, { force: true });
    return null;
  } finally {
    clearTimeout(idle);
  }
}

async function cache(kind, plexPath) {
  const url = new URL(plexPath, PLEX_URL);
  if (url.origin !== new URL(PLEX_URL).origin) return null;
  const k = KINDS[kind],
    hash = crypto
      .createHash("sha256")
      .update(url.pathname + url.search)
      .digest("hex");
  const hit = extsOf(k)
    .map((e) => hash + e)
    .find((f) => fs.existsSync(path.join(DATA, k.dir, f)));
  if (hit) return hit;
  const id = kind + hash;
  if (!inflight.has(id))
    inflight.set(
      id,
      download(kind, url, hash).finally(() => inflight.delete(id)),
    );
  return inflight.get(id);
}

export async function pool(items, size, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length) await fn(queue.shift());
    }),
  );
}

export async function cacheSlideAssets(slides) {
  const jobs = slides.flatMap((s) => [
    ...(s.items ?? [s])
      .filter((o) => o.thumb)
      .map((o) => ({ kind: "artwork", o, key: "thumb" })),
    ...(s.audio ? [{ kind: s.audio.kind, o: s.audio, key: "path" }] : []),
  ]);
  await pool(jobs, 4, async (j) => {
    j.o[j.key] = await cache(j.kind, j.o[j.key]);
  });
  for (const s of slides) if (s.audio && !s.audio.path) s.audio = null;
}
