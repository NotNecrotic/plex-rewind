import { Router } from "express";
import path from "node:path";
import { requireAuth } from "../auth/middleware.js";
import { avatarsDirPath } from "../avatars.js";

const router = Router();

router.get("/:file", requireAuth, (req, res) => {
  const file = req.params.file as string;

  if (!/^[a-zA-Z0-9_-]+\.(jpg|png|gif|webp)$/.test(file)) {
    res.status(400).json({ error: "Invalid avatar file" });
    return;
  }

  res.sendFile(path.join(avatarsDirPath(), file), (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ error: "Avatar not found" });
    }
  });
});

export default router;
