// Tautuilli API documentation: https://docs.tautulli.com/extending-tautulli/api-reference

import { config } from "../config/env.js";

interface TautulliResponse<T> {
  response: {
    result: "success" | "error";
    message: string | null;
    data: T;
  };
}

export interface TautulliServerStatus {
  result: string;
  connected: boolean;
}

// Tautulli API client
export class TautulliClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.TAUTULLI_URL.replace(/\/+$/, "");
    this.apiKey = config.TAUTULLI_API_KEY;
  }

  private async request<T>(command: string): Promise<T> {
    const url = new URL("/api/v2", `${this.baseUrl}/`);

    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("cmd", command);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Tautulli request failed: ${response.status} ${response.statusText}`,
      );
    }

    const json = (await response.json()) as TautulliResponse<T>;

    if (json.response.result !== "success") {
      throw new Error(
        `Tautulli API error: ${json.response.message ?? "Unknown error"}`,
      );
    }

    return json.response.data;
  }

  async getServerStatus(): Promise<TautulliServerStatus> {
    return this.request<TautulliServerStatus>("server_status");
  }
}
