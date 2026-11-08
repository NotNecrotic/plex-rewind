const D = 864e5; // 86,400,000 ms (24 hours)

export const timezone = (() => {
  const tz = process.env.timezone || "UTC";
  try {
    new Intl.DateTimeFormat("en-NZ", { timeZone: tz });
    return tz;
  } catch {
    console.warn(`timezone="${tz}" is not a valid timezone, using UTC`);
    return "UTC";
  }
})();

const clock = new Intl.DateTimeFormat("en-NZ", {
  timeZone: timezone,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

export const wall =
  timezone === "UTC"
    ? (t) => t
    : (t) => {
        const p = Object.fromEntries(
          clock.formatToParts(t).map((x) => [x.type, x.value]),
        );
        return Date.UTC(
          +p.year,
          p.month - 1,
          +p.day,
          +p.hour,
          +p.minute,
          +p.second,
        );
      };

export const instant = (w) => {
  const t = w - (wall(w) - w);
  return w - (wall(t) - t);
};

export const periodOf = (k) =>
  /W/.test(k) ? "week" : k.length > 4 ? "month" : "year";

const monday1 = (y) => {
  const j = Date.UTC(y, 0, 4);
  return j - ((new Date(j).getUTCDay() + 6) % 7) * D;
};

export function range(k) {
  const p = periodOf(k),
    y = +k.slice(0, 4);
  let a, b;
  if (p === "year") [a, b] = [Date.UTC(y, 0, 1), Date.UTC(y + 1, 0, 1)];
  else if (p === "month") {
    const m = +k.slice(5, 7);
    [a, b] = [Date.UTC(y, m - 1, 1), Date.UTC(y, m, 1)];
  } else {
    a = monday1(y) + (+k.slice(6) - 1) * 7 * D;
    b = a + 7 * D;
  }
  return [instant(a), instant(b)];
}

export function weekKey(t) {
  const d = new Date(t),
    th =
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) +
      (3 - ((d.getUTCDay() + 6) % 7)) * D;
  const y = new Date(th).getUTCFullYear();
  return `${y}-W${String(Math.floor((th - monday1(y)) / (7 * D)) + 1).padStart(2, "0")}`;
}

export const monthKey = (t) => new Date(t).toISOString().slice(0, 7);
export const label = (k) => {
  const p = periodOf(k);
  return p === "week"
    ? `Week ${+k.slice(6)}, ${k.slice(0, 4)}`
    : p === "month"
      ? new Date(k + "-01").toLocaleString("en", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : k;
};

export const big = (k) => {
  const p = periodOf(k);
  return p === "week"
    ? "W" + +k.slice(6)
    : p === "month"
      ? new Date(k + "-01").toLocaleString("en", {
          month: "short",
          timeZone: "UTC",
        })
      : k;
};
