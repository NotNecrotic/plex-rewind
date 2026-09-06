import { type RewindDescriptor } from "../types";

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

export const api = new ApiService();
