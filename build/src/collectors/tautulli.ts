// Tautuilli API documentation: https://docs.tautulli.com/extending-tautulli/api-reference

import { config } from "../config/env.js";

interface TautulliResponse<T> {
  response: {
    result: "success" | "error";
    message: string | null;
    data: T;
  };
}

export interface TautulliTableResponse<T> {
  recordsFiltered: number;
  recordsTotal: number;
  total_duration: string;
  filter_duration: string;
  data: T[];
}

export interface TautulliServerStatus {
  result: string;
  connected: boolean;
}

export interface TautulliHistoryItem {
  id: number | null;
  date: number;
  duration: number;
  friendly_name: string;
  full_title: string;
  grandparent_rating_key: number | null;
  grandparent_title: string;
  original_title: string;
  group_count: number | null;
  group_ids: string | null;
  guid: string;
  ip_address: string;
  live: number;
  machine_id: string;
  media_index: number | null;
  media_type: string;
  originally_available_at: string | null;
  parent_media_index: number | null;
  parent_rating_key: number | null;
  parent_title: string;
  paused_counter: number;
  percent_complete: number;
  platform: string;
  product: string;
  player: string;
  rating_key: number;
  reference_id: number;
  row_id: number | null;
  session_key: number | null;
  started: number;
  state: string;
  stopped: number;
  thumb: string | null;
  title: string;
  transcode_decision: string;
  user: string;
  user_id: number;
  watched_status: number;
  year: number | null;
  location: string;
  relayed: number;
  secure: number;
  user_thumb: string | null;
}

export interface TautulliUser {
  allow_guest: number;
  deleted_user: boolean;
  do_notify: number;
  email: string | null;
  friendly_name: string;
  is_active: number;
  is_admin: number;
  is_allow_sync: number;
  is_home_user: number;
  is_restricted: number;
  keep_history: number;
  last_seen: number;
  row_id: number;
  shared_libraries: string[] | string;
  user_id: string;
  user_thumb: string | null;
  username: string;
}

export interface TautulliServerInfo {
  pms_identifier: string;
  pms_ip: string;
  pms_name: string;
  pms_platform: string;
  pms_plexpass: number;
  pms_port: number;
  pms_ssl: number;
  pms_url: string;
  pms_url_manual: number;
  pms_version: string;
}

// Tautulli API client
export class TautulliClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = config.TAUTULLI_URL.replace(/\/+$/, "");
    this.apiKey = config.TAUTULLI_API_KEY;
  }

  private async request<T>(
    command: string,
    params: Record<string, string | number | boolean | undefined> = {},
  ): Promise<T> {
    const url = new URL("/api/v2", `${this.baseUrl}/`);

    url.searchParams.set("apikey", this.apiKey);
    url.searchParams.set("cmd", command);

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined) {
        continue;
      }

      url.searchParams.set(
        key,
        typeof value === "boolean" ? (value ? "1" : "0") : String(value),
      );
    }

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

  async getServerInfo(): Promise<TautulliServerInfo> {
    return this.request<TautulliServerInfo>("get_server_info");
  }

  /**
   * Retrieve playback history.
   *
   * Tautulli's get_history endpoint is paginated. This function continues requesting
   * pages until the complete filtered result set has been collected.
   */
  async getHistory(): Promise<TautulliHistoryItem[]> {
    const history: TautulliHistoryItem[] = [];
    const pageSize = 1000;

    let start = 0;

    while (true) {
      const result = await this.request<
        TautulliTableResponse<TautulliHistoryItem>
      >("get_history", {
        start,
        length: pageSize,
      });

      history.push(...result.data);

      if (result.data.length < pageSize) {
        break;
      }

      start += result.data.length;
    }

    return history;
  }

  async getUsers(): Promise<TautulliUser[]> {
    return this.request<TautulliUser[]>("get_users");
  }
}
