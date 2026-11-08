import { build } from "./builder.js";
import { notify } from "./notify.js";
import { read, write } from "./store.js";
import { timezone, wall, weekKey, monthKey } from "./periods.js";

const D = 864e5; // 86,400,000 ms (24 hours)

const raw = process.env.YEAR_RELEASE?.trim(),
  YEAR_RELEASE = !raw
    ? "12-01"
    : /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(raw)
      ? raw
      : (console.warn(
          `[SCHEDULAR] YEAR_RELEASE="${raw}" is not MM-DD, using 12-01`,
        ),
        "12-01");
const yearOf = (w) => new Date(w).getUTCFullYear();
const yearReleased = (w) =>
  new Date(w).toISOString().slice(5, 10) >= YEAR_RELEASE;

const SLOTS = [
  // Every Monday
  { slot: "week", mail: true, key: (w) => weekKey(w - 7 * D) },
  // 1st of every month
  {
    slot: "month",
    mail: true,
    key: (w) => monthKey(Date.UTC(yearOf(w), new Date(w).getUTCMonth(), 1) - 1),
  },
  // Date of `YEAR_RELEASE`
  {
    slot: "year",
    mail: true,
    key: (w) => (yearReleased(w) ? String(yearOf(w)) : null),
  },
  // Previous year e.g. Jan 1st 2027 returns 2026
  {
    slot: "yearFinal",
    mail: false,
    key: (w) => (yearReleased(w) ? null : String(yearOf(w) - 1)),
  },
];

async function run({ slot, mail }, key) {
  const state = read("state", {}),
    prev = state[slot];
  if (prev === key) return;

  write("state", { ...state, [slot]: key });

  try {
    const built = await build(key);
    console.log(`[SCHEDULAR] built ${key} for ${built.length} users`);
    if (mail) await notify(key, built);
  } catch (e) {
    console.error(`[SCHEDULAR] ${key} failed: ${e.message}`);
    write("state", { ...read("state", {}), [slot]: prev });
  }
}

let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    const w = wall(Date.now());
    for (const s of SLOTS) {
      const key = s.key(w);
      if (key) await run(s, key);
    }
  } finally {
    busy = false;
  }
}

export function start() {
  if (!process.env.PLEX_URL)
    return console.log("[SCHEDULAR] PLEX_URL not set, scheduler off");
  console.log(
    `[SCHEDULER] Started (${timezone}). Runs at 00:00: weekly on Mondays, monthly on the 1st, and yearly on ${YEAR_RELEASE}.`,
  );
  tick();
  setInterval(tick, 5 * 60e3); // 300,000 ms (5 minutes)
}
