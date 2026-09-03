import { db } from "../db/database.js";

export interface User {
  id: number;
  plexId: number;
  plexUsername: string | null;
  plexEmail: string | null;
  plexThumb: string | null;
  plexToken: string;
  createdAt: string;
  updatedAt: string;
}

function mapUser(row: any): User {
  return {
    id: row.id,
    plexId: row.plex_id,
    plexUsername: row.plex_username,
    plexEmail: row.plex_email,
    plexThumb: row.plex_thumb,
    plexToken: row.plex_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function findUserByPlexId(plexId: number): User | null {
  const row = db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE plex_id = ?
    `,
    )
    .get(plexId);

  return row ? mapUser(row) : null;
}

export function createUser(data: {
  plexId: number;
  plexUsername?: string | null;
  plexEmail?: string | null;
  plexThumb?: string | null;
  plexToken: string;
}): User {
  const result = db
    .prepare(
      `
      INSERT INTO users (
        plex_id,
        plex_username,
        plex_email,
        plex_thumb,
        plex_token
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    )
    .run(
      data.plexId,
      data.plexUsername ?? null,
      data.plexEmail ?? null,
      data.plexThumb ?? null,
      data.plexToken,
    );

  const user = db
    .prepare(
      `
      SELECT *
      FROM users
      WHERE id = ?
    `,
    )
    .get(result.lastInsertRowid);

  if (!user) {
    throw new Error("Failed to create user");
  }

  return mapUser(user);
}

export function updateUser(
  plexId: number,
  data: {
    plexUsername?: string | null;
    plexEmail?: string | null;
    plexThumb?: string | null;
    plexToken?: string;
  },
): User | null {
  db.prepare(
    `
    UPDATE users
    SET
      plex_username = COALESCE(?, plex_username),
      plex_email = COALESCE(?, plex_email),
      plex_thumb = COALESCE(?, plex_thumb),
      plex_token = COALESCE(?, plex_token),
      updated_at = CURRENT_TIMESTAMP
    WHERE plex_id = ?
  `,
  ).run(
    data.plexUsername ?? null,
    data.plexEmail ?? null,
    data.plexThumb ?? null,
    data.plexToken ?? null,
    plexId,
  );

  return findUserByPlexId(plexId);
}

export function findOrCreateUser(data: {
  plexId: number;
  plexUsername?: string | null;
  plexEmail?: string | null;
  plexThumb?: string | null;
  plexToken: string;
}): User {
  const existingUser = findUserByPlexId(data.plexId);

  if (existingUser) {
    return (
      updateUser(data.plexId, {
        plexUsername: data.plexUsername,
        plexEmail: data.plexEmail,
        plexThumb: data.plexThumb,
        plexToken: data.plexToken,
      }) ?? existingUser
    );
  }

  return createUser(data);
}
