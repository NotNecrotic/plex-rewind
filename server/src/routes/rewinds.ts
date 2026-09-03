import { Router } from "express";
import { requireAuth, sessionUserOf } from "../auth/middleware.js";
import {
  getUserRewind,
  isRewindLive,
  listAvailableRewinds,
  type RewindSummary,
} from "../rewinds/rewinds.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (_req, res) => {
  const rewinds = (await listAvailableRewinds()).filter((rewind) =>
    isRewindLive(rewind.liveDate),
  );

  res.json({ rewinds });
});

router.get("/mine", async (req, res) => {
  const { plexId } = sessionUserOf(req);
  const available: RewindSummary[] = [];

  for (const rewind of await listAvailableRewinds()) {
    if (!isRewindLive(rewind.liveDate)) continue;

    const data = await getUserRewind(rewind.id, plexId);
    if (data) {
      available.push(rewind);
    }
  }

  res.json({ rewinds: available });
});

router.get("/:rewindId/me", async (req, res) => {
  const { rewindId } = req.params as { rewindId: string };
  const { plexId } = sessionUserOf(req);

  const all = await listAvailableRewinds();
  const summary = all.find((entry) => entry.id === rewindId);
  if (summary && !isRewindLive(summary.liveDate)) {
    res.status(404).json({
      error: "This rewind is not live yet",
      rewind: rewindId,
    });
    return;
  }

  const rewind = await getUserRewind(rewindId, plexId);

  if (!rewind) {
    res.status(404).json({
      error: "No rewind found for this user",
      rewind: rewindId,
    });
    return;
  }

  res.json(rewind);
});

export default router;
