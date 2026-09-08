import { Router } from "express";
import { fetchArtwork } from "../artwork.js";

const router = Router();

router.get("/", async (req, res) => {
  const year = req.query.year;
  const asset = req.query.asset;

  if (typeof year !== "string" || typeof asset !== "string") {
    res.status(400).json({
      error: "Invalid artwork request",
    });
    return;
  }

  try {
    const { contentType, body } = await fetchArtwork(year, asset);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=86400");

    res.send(body);
  } catch (error) {
    console.error("Artwork request failed:", error);

    res.status(404).json({
      error: "Artwork not found",
    });
  }
});

export default router;
