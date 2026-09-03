import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./db/schema.js";
import { requireAuth } from "./auth/middleware.js";
import authRoutes from "./routes/auth.js";
import rewindRoutes from "./routes/rewinds.js";
import artworkRoutes from "./routes/artwork.js";
import avatarRoutes from "./routes/avatars.js";
import { getServerIdentity, rewindsRootPath } from "./rewinds/rewinds.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/rewinds", rewindRoutes);
app.use("/api/artwork", artworkRoutes);
app.use("/api/avatars", avatarRoutes);

app.use("/rewind-assets/:rewindId", (req, res, next) => {
  const rewindId = req.params.rewindId;
  if (!/^[A-Za-z0-9_-]+$/.test(rewindId)) {
    res.status(400).json({ error: "Invalid rewind id" });
    return;
  }
  req.url = `/${rewindId}/assets${req.url}`;
  express
    .static(rewindsRootPath(), { maxAge: "30d", immutable: true })
    .call(null, req, res, next);
});

app.get("/api/server", requireAuth, async (_req, res) => {
  res.json(await getServerIdentity());
});

app.listen(PORT, () => {
  console.log(`Plex Wrapped API running on http://localhost:${PORT}`);
});
