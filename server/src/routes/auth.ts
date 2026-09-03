import { Router } from "express";
import { deleteSession } from "../auth/session.js";
import { createPin, checkPin, getPlexUser } from "../plex/auth.js";
import { findOrCreateUser } from "../users/users.js";
import { createSession, getSessionUser } from "../auth/session.js";
import { cacheAvatar, avatarsDirPath } from "../avatars.js";
import { existsSync } from "node:fs";
import path from "node:path";

function cachedAvatarPath(plexId: number): string | null {
  for (const extension of ["png", "jpg", "gif", "webp"]) {
    const file = `${plexId}.${extension}`;
    if (existsSync(path.join(avatarsDirPath(), file))) {
      return `/api/avatars/${file}`;
    }
  }
  return null;
}

const router = Router();

router.post("/logout", (req, res) => {
  const sessionId = req.cookies?.session;
  if (sessionId) {
    deleteSession(sessionId);
  }
  res.clearCookie("session");
  res.json({ ok: true });
});

router.get("/plex/start", async (_req, res) => {
  try {
    const pin = await createPin();

    res.json({
      id: pin.id,
      code: pin.code,
      authUrl: "https://plex.tv/link",
      expiresAt: pin.expiresAt,
    });
  } catch (error) {
    console.error("Failed to create Plex PIN:", error);

    res.status(500).json({
      error: "Failed to start Plex authentication",
    });
  }
});

router.get("/plex/status/:id", async (req, res) => {
  try {
    const pinId = Number(req.params.id);

    if (!Number.isInteger(pinId)) {
      res.status(400).json({
        error: "Invalid PIN ID",
      });

      return;
    }

    const pin = await checkPin(pinId);

    if (pin.authToken) {
      const plexUser = await getPlexUser(pin.authToken);
      console.log("Plex /user response:", JSON.stringify(plexUser, null, 2));
      const user = findOrCreateUser({
        plexId: plexUser.id,
        plexUsername: plexUser.username,
        plexEmail: plexUser.email ?? null,
        plexThumb: plexUser.thumb ?? null,
        plexToken: pin.authToken,
      });

      await cacheAvatar(plexUser.id, plexUser.thumb);

      const sessionId = createSession(user.id);

      res.cookie("session", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json({
        status: "authorized",
      });

      return;
    }

    res.json({
      status: "waiting",
    });
  } catch (error) {
    console.error("Failed to check Plex authentication:", error);

    res.status(500).json({
      error: "Failed to check Plex authentication",
    });
  }
});

router.get("/status", (req, res) => {
  const sessionId = req.cookies.session;

  if (!sessionId) {
    res.json({
      authenticated: false,
    });

    return;
  }

  const user = getSessionUser(sessionId);

  if (!user) {
    res.clearCookie("session");

    res.json({
      authenticated: false,
    });

    return;
  }

  res.json({
    authenticated: true,
    user: {
      id: user.id,
      plexId: user.plexId,
      username: user.plexUsername,
      email: user.plexEmail,
      thumb: cachedAvatarPath(user.plexId) ?? user.plexThumb,
    },
  });
});

export default router;
