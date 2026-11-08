import express from "express";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { createPin, checkPin, getUser, authUrl } from "./plex.js";
import { read, write } from "./store.js";
import { start } from "./scheduler.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BASE = process.env.BASE_URL || "http://localhost:3001";
const DATA = path.resolve(process.env.DATA_DIR || "data/rewinds");
const KEY = /^\d{4}(-\d{2}|-W\d{2})?$/;

const sessions = new Map(),
  pins = new Map();
const sid = (r) =>
  Object.fromEntries(
    (r.headers.cookie || "")
      .split("; ")
      .filter(Boolean)
      .map((c) => c.split("=")),
  )["sid"];
const auth = (q, s, n) => {
  const u = sessions.get(sid(q));
  if (!u) return s.status(401).json({ error: "signed_out" });
  q.user = u;
  n();
};
const file = (uid, key) => path.join(DATA, String(uid), key + ".json");

function owns(uid, filename) {
  if (!uid || !filename) return false;

  const dir = path.join(DATA, String(uid));
  if (!fs.existsSync(dir)) return false;

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .some((file) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));

        return JSON.stringify(data).includes(filename);
      } catch {
        return false;
      }
    });
}

app.post("/api/auth/start", async (_q, s) => {
  const p = await createPin();
  pins.set(String(p.id), p.code);
  s.json({ pin: p.id, url: authUrl(p.code, `${BASE}/auth/callback`) });
});

app.post("/api/auth/finish", async (q, s) => {
  const pin = String(q.body.pin),
    code = pins.get(pin);
  if (!code) return s.status(400).json({ error: "unknown_pin" });
  const r = await checkPin(pin, code);
  if (!r.authToken) return s.status(202).json({ pending: true });
  const u = await getUser(r.authToken);
  pins.delete(pin);
  const users = read("users", {}),
    old = users[u.id] || {};
  users[u.id] = {
    ...old,
    username: u.username,
    email: u.email,
    notify: old.notify || { week: false, month: true, year: true },
  };
  write("users", users);
  const id = crypto.randomBytes(24).toString("hex");
  sessions.set(id, { id: u.id, username: u.username, thumb: u.thumb });
  s.setHeader(
    "Set-Cookie",
    `sid=${id}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`,
  );
  s.json({ ok: true });
});

app.post("/api/auth/logout", (q, s) => {
  sessions.delete(sid(q));
  s.setHeader("Set-Cookie", "sid=; Path=/; Max-Age=0");
  s.json({ ok: true });
});

app.get("/api/me", auth, (q, s) => {
  const u = read("users", {})[q.user.id] || {};
  s.json({ ...q.user, notify: u.notify || {}, email: u.email });
});

app.put("/api/me/notify", auth, (q, s) => {
  const users = read("users", {});
  if (!users[q.user.id]) return s.sendStatus(404);
  const b = q.body;
  users[q.user.id].notify = {
    week: !!b.week,
    month: !!b.month,
    year: !!b.year,
  };
  write("users", users);
  s.json({ ok: true });
});

app.get("/api/rewinds", auth, (q, s) => {
  const dir = path.join(DATA, String(q.user.id));
  if (!fs.existsSync(dir)) return s.json([]);
  const sh = read("shares", {});
  s.json(
    fs
      .readdirSync(dir)
      .filter((f) => KEY.test(f.slice(0, -5)))
      .map((f) => {
        const j = JSON.parse(fs.readFileSync(path.join(dir, f))),
          sl = (id) => j.slides.find((x) => x.id === id),
          t = Object.keys(sh).find(
            (k) => sh[k].uid === q.user.id && sh[k].key === j.key,
          );
        return {
          key: j.key,
          period: j.period,
          big: j.big,
          label: j.label,
          hours: j.summary?.hours,
          personality: sl("personality")?.title,
          pct: sl("percent")?.pct,
          binge: sl("binge") && {
            show: sl("binge").show,
            episodes: sl("binge").episodes,
          },
          covers: ["movies", "shows", "artists"]
            .map((id) => sl(id)?.items[0])
            .filter((x) => x?.thumb)
            .map((x) => ({ name: x.name, thumb: x.thumb })),
          link: t && `${BASE}/s/${t}`,
        };
      })
      .sort((a, b) => b.key.localeCompare(a.key)),
  );
});

app.get("/api/rewinds/:key", auth, (q, s) => {
  if (!KEY.test(q.params.key)) return s.sendStatus(400);
  const f = file(q.user.id, q.params.key);
  fs.existsSync(f)
    ? s.type("json").send(fs.readFileSync(f))
    : s.sendStatus(404);
});

app.post("/api/rewinds/:key/share", auth, (q, s) => {
  const key = q.params.key;
  if (!KEY.test(key) || !fs.existsSync(file(q.user.id, key)))
    return s.sendStatus(404);
  const sh = read("shares", {});
  let t = Object.keys(sh).find(
    (k) => sh[k].uid === q.user.id && sh[k].key === key,
  );
  if (!t) {
    t = crypto.randomBytes(9).toString("base64url");
    sh[t] = { uid: q.user.id, key };
    write("shares", sh);
  }
  s.json({ url: `${BASE}/s/${t}` });
});

app.delete("/api/rewinds/:key/share", auth, (q, s) => {
  const sh = read("shares", {});
  for (const t of Object.keys(sh))
    if (sh[t].uid === q.user.id && sh[t].key === q.params.key) delete sh[t];
  write("shares", sh);
  s.json({ ok: true });
});

app.get("/api/public/:token", (q, s) => {
  const x = read("shares", {})[q.params.token];
  if (!x || !fs.existsSync(file(x.uid, x.key))) return s.sendStatus(404);
  s.type("json").send(fs.readFileSync(file(x.uid, x.key)));
});

app.get(/^\/api\/img\/?$/, (q, s) => {
  const p = q.query.p;
  const u = sessions.get(sid(q));

  if (typeof p !== "string") return s.sendStatus(400);

  const match = p.match(/^([a-f0-9]{64}\.(?:jpg|png|webp|gif))$/i);
  if (!match) return s.sendStatus(400);

  const filename = match[1];

  if (!(u ? owns(u.id, filename) : shared(q.query.t, filename))) {
    return s.sendStatus(404);
  }

  s.sendFile(path.join(DATA, "_artwork", filename), (err) => {
    if (err && !s.headersSent) s.sendStatus(404);
  });
});

app.get(/^\/api\/audio\/?$/, (q, s) => {
  const p = q.query.p;
  const u = sessions.get(sid(q));

  if (typeof p !== "string") return s.sendStatus(400);

  const match = p.match(
    /^([a-f0-9]{64}\.(?:mp3|m4a|aac|flac|ogg|opus|wav|wma))$/i,
  );

  if (!match) return s.sendStatus(400);

  const filename = match[1];

  if (!(u ? owns(u.id, filename) : shared(q.query.t, filename))) {
    return s.sendStatus(404);
  }

  s.sendFile(path.join(DATA, "_audio", filename), (err) => {
    if (err && !s.headersSent) s.sendStatus(404);
  });
});

app.get("/api/audio", async (q, s) => {
  const u = sessions.get(sid(q));
  const p = q.query.p;

  if (!u) return s.sendStatus(401);

  if (typeof p !== "string" || !AUD.test(p) || !owns(u.id, p))
    return s.sendStatus(404);

  const r = await plex(p, q.headers.range).catch(() => null);

  if (!r || !(r.ok || r.status === 206)) return s.sendStatus(404);

  s.status(r.status);

  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ]) {
    const value = r.headers.get(h);
    if (value) s.set(h, value);
  }

  Readable.fromWeb(r.body).pipe(s);
});

const dist = path.resolve("web/dist");
app.use(express.static(dist));
app.get("*", (_q, s) => s.sendFile(path.join(dist, "index.html")));
app.listen(PORT, () => {
  console.log(`Plex Rewind on :${PORT}`);
  start();
});
