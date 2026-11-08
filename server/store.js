import fs from "fs";
import path from "path";
const dir = path.resolve(process.env.STATE_DIR || "data");
export const read = (n, d) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, n + ".json")));
  } catch {
    return d;
  }
};
export const write = (n, o) => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, n + ".json"), JSON.stringify(o, null, 1));
};
