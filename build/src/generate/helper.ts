import type { TautulliHistoryItem } from "../collectors/tautulli.js";

export function historySeconds(item: TautulliHistoryItem): number {
  const watched = Number(item.duration);
  if (Number.isFinite(watched) && watched > 0) {
    return watched;
  }
  const total = Number(item.duration);
  return Number.isFinite(total) && total > 0 ? total : 0;
}
