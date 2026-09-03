const PLEX_API = "https://plex.tv/api/v2";

const CLIENT_IDENTIFIER = process.env.PLEX_CLIENT_IDENTIFIER || "plex-rewind";

const PRODUCT_NAME = "Plex Wrapped";

interface PlexPin {
  id: number;
  code: string;
  authToken?: string;
  expiresAt?: string;
}

export interface PlexAuthSession {
  id: number;
  code: string;
  authUrl: string;
  authToken?: string;
}

export interface PlexUser {
  id: number;
  username: string;
  email?: string;
  title?: string;
  thumb?: string;
}

async function plexRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("X-Plex-Client-Identifier", CLIENT_IDENTIFIER);
  headers.set("X-Plex-Product", PRODUCT_NAME);
  headers.set("X-Plex-Version", "1.0.0");
  headers.set("X-Plex-Platform", "Web");

  return fetch(`${PLEX_API}${endpoint}`, {
    ...options,
    headers,
  });
}

export async function createPin(): Promise<PlexPin> {
  const response = await plexRequest("/pins", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Plex PIN creation failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    code: data.code,
    expiresAt: data.expiresAt,
  };
}

export async function checkPin(pinId: number): Promise<PlexPin> {
  const response = await plexRequest(`/pins/${pinId}`);

  if (!response.ok) {
    throw new Error(`Plex PIN check failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    code: data.code,
    authToken: data.authToken,
    expiresAt: data.expiresAt,
  };
}

export function getPlexAuthUrl(code: string): string {
  return `https://plex.tv/link?code=${encodeURIComponent(code)}`;
}

export async function getPlexUser(authToken: string): Promise<PlexUser> {
  const response = await plexRequest("/user", {
    headers: {
      "X-Plex-Token": authToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Plex user: ${response.status}`);
  }

  const data = await response.json();

  return {
    id: data.id,
    username: data.username,
    email: data.email,
    title: data.title,
    thumb: data.thumb,
  };
}
