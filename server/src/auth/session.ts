import crypto from "node:crypto";
import { db } from "../db/database.js";

const SESSION_DURATION_DAYS = 30;

export interface SessionUser {
  id: number;
  plexId: number;
  plexUsername: string | null;
  plexEmail: string | null;
  plexThumb: string | null;
}

export function createSession(userId: number): string {
  const sessionId = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  db.prepare(
    `
    INSERT INTO sessions (
      id,
      user_id,
      expires_at
    )
    VALUES (?, ?, ?)
  `,
  ).run(sessionId, userId, expiresAt.toISOString());

  return sessionId;
}

export function getSessionUser(sessionId: string): SessionUser | null {
  const row = db
    .prepare(
      `
    SELECT
      users.id,
      users.plex_id,
      users.plex_username,
      users.plex_email,
      users.plex_thumb
    FROM sessions
    INNER JOIN users
      ON users.id = sessions.user_id
    WHERE sessions.id = ?
      AND sessions.expires_at > ?
  `,
    )
    .get(sessionId, new Date().toISOString()) as
    | {
        id: number;
        plex_id: number;
        plex_username: string | null;
        plex_email: string | null;
        plex_thumb: string | null;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    plexId: row.plex_id,
    plexUsername: row.plex_username,
    plexEmail: row.plex_email,
    plexThumb: row.plex_thumb,
  };
}

export function deleteSession(sessionId: string): void {
  db.prepare(
    `
    DELETE FROM sessions
    WHERE id = ?
  `,
  ).run(sessionId);
}
