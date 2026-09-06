export interface RewindData {
  user: RewindUserInfo;
  rewind: RewindMeta;
  scenes: Record<string, unknown>;
}

export interface TopMovieEntry {
  rank: number;
  ratingKey: number | null;
  title: string;
  year: number | null;
  plays: number;
  watchTimeSeconds: number;
  thumb: string | null;
}

export interface RewindUserInfo {
  id: number;
  name: string;
  thumb: string | null;
}

export interface RewindMeta {
  id: string;
  year: number;
  title: string;
  liveDate: string;
  serverName: string | null;
}

export interface RewindDescriptor {
  id: string;
  year: number;
  title: string;
  liveDate: string;
  serverName: string | null;
  userCount: number;
}
