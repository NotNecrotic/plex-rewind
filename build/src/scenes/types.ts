export interface SceneDefinition {
  id: string;
  name: string;
  description?: string;
  requirements: Requirement[];
}

export enum Scene {
  TopMovies = "top-movies",
  TopShows = "top-shows",
  TopUsers = "top-users",
}

export enum Requirement {
  // Tautulli
  TautulliGetHistory = "tautulli.getHistory",
  TautulliGetUsers = "tautulli.getUsers",
}
