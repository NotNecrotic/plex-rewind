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
  thumb: string | null;
}

export interface TopMoviesScene {
  movies: TopMovieEntry[];
  background: string | null;
  totalMovies: number;
}

export interface TopShowEntry {
  rank: number;
  ratingKey: number | null;
  title: string;
  year: number | null;
  episodes: number;
  seasons: number;
  thumb: string | null;
}

export interface TopShowsScene {
  shows: TopShowEntry[];
  background: string | null;
  totalShows: number;
  totalEpisodes: number;
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
