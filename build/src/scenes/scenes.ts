import { Requirement, Scene, type SceneDefinition } from "./types.js";

export const scenes: SceneDefinition[] = [
  {
    id: Scene.TopMovies,
    name: "Top Movies",
    description: "The movies watched most during the year.",
    requirements: [Requirement.TautulliGetHistory],
  },

  {
    id: Scene.TopShows,
    name: "Top Shows",
    description: "The TV shows watched most during the year.",
    requirements: [Requirement.TautulliGetHistory],
  },

  {
    id: Scene.TopUsers,
    name: "Top Users",
    description: "The users who watched the most during the year.",
    requirements: [Requirement.TautulliGetHistory],
  },
];
