import { build } from "../server/builder.js";
import { notify } from "../server/notify.js";

const a = process.argv.slice(2),
  arg = (k, d = "") => {
    const i = a.indexOf("--" + k);
    return i < 0 ? d : a[i + 1];
  },
  list = (k) => arg(k).split(",").filter(Boolean);

const key = arg("key", String(new Date().getFullYear()));
const built = await build(key, { skip: list("skip"), only: list("only") });

console.log(built.map((b) => `${b.uid}: ${b.hours}h`).join("\n") || "no data");

if (a.includes("--notify")) await notify(key, built);
else console.log("[MAIL] skipped (use --notify to send)");
