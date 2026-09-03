import { Router } from "express";
import { requireAuth } from "../auth/middleware.js";
import { fetchArtwork, isSafeArtworkPath } from "../plex/artwork.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const artworkPath = req.query.path;

  if (typeof artworkPath !== "string" || !isSafeArtworkPath(artworkPath)) {
    res.status(400).json({ error: "Invalid artwork path" });
    return;
  }

  try {
    const { contentType, body } = await fetchArtwork(artworkPath);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.send(Buffer.from(body));
  } catch (error) {
    console.error("Artwork proxy failed:", error);
    res.status(502).json({ error: "Failed to load artwork" });
  }
});

export default router;
