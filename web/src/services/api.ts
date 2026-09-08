import type { RewindData, RewindDescriptor } from "../types";

export interface PlexAuthStartResponse {
  id: number;
  code: string;
}

export type PlexAuthStatus = "waiting" | "linked" | "expired";

export interface AuthUser {
  id: number;
  plexId: number;
  username: string | null;
  email: string | null;
  thumb: string | null;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user?: AuthUser;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000/api") {
    this.baseUrl = baseUrl;
  }

  async getRewind(rewindId: string): Promise<RewindData> {
    const url = `${this.baseUrl}/rewinds/${encodeURIComponent(rewindId)}/me`;
    const response = await fetch(url, {
      credentials: "include",
    });

    if (response.status === 404) {
      throw new Error(
        "No rewind is available for your account for this season.",
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch rewind: ${response.statusText}`);
    }

    return (await response.json()) as RewindData;
  }

  async getAvailableRewinds(): Promise<RewindDescriptor[]> {
    const response = await fetch(`${this.baseUrl}/rewinds`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch available rewinds");
    }

    const data = (await response.json()) as { rewinds?: RewindDescriptor[] };
    return data.rewinds ?? [];
  }

  async getMyRewinds(): Promise<RewindDescriptor[]> {
    const response = await fetch(`${this.baseUrl}/rewinds/mine`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch your rewinds");
    }

    const data = (await response.json()) as { rewinds?: RewindDescriptor[] };
    return data.rewinds ?? [];
  }

  // Sign out of the current session
  async signOut(): Promise<void> {
    await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  }

  async getServerName(): Promise<string | null> {
    const response = await fetch(`${this.baseUrl}/server`, {
      credentials: "include",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { name?: string | null };
    return data.name ?? null;
  }

  async checkAuth(): Promise<AuthStatusResponse> {
    const response = await fetch(`${this.baseUrl}/auth/status`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to check authentication: ${response.statusText}`);
    }

    return (await response.json()) as AuthStatusResponse;
  }

  // Start the Plex pin authentication
  async startPlexAuth(): Promise<PlexAuthStartResponse> {
    const response = await fetch(`${this.baseUrl}/auth/plex/start`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to start Plex authentication: ${response.statusText}`,
      );
    }

    return (await response.json()) as PlexAuthStartResponse;
  }

  // Check whether the Plex pin authentication has been completed
  async checkPlexAuth(pinId: number): Promise<PlexAuthStatus> {
    const response = await fetch(`${this.baseUrl}/auth/plex/status/${pinId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to check Plex authentication: ${response.statusText}`,
      );
    }

    const data = (await response.json()) as { status: PlexAuthStatus };
    return data.status;
  }
}

export function assetUrl(
  asset: string | null | undefined,
  year: number,
): string | null {
  if (!asset) return null;

  return `http://localhost:3000/api/artwork?year=${year}&asset=${encodeURIComponent(asset)}`;
}

export const api = new ApiService();
