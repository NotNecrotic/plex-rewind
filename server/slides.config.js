// Slide settings you are likely to tweak. The code that uses them lives in builder.js.

// Slides in the order they play to the viewer.
export const SLIDE_ORDER = [
  "intro",
  "hours",
  "movies",
  "shows",
  "binge",
  "artists",
  "tracks",
  "screenGenres",
  "musicGenres",
  "peak",
  "months",
  "personality",
  "percent",
];

// Slides skipped for each kind of rewind (short periods have too little data for some).
export const SKIP_BY_PERIOD = {
  week: ["screenGenres", "musicGenres", "months", "percent", "personality"],
  month: ["months"],
  year: [],
};

export const LIMITS = {
  topItems: 5, // entries in each top list
  minItems: 3, // a top list needs at least this many entries to appear
  minUsers: 5, // "Top X% of viewers" needs at least this many people with data
  minBinge: 4, // episodes of one show in one day before the binge slide appears
};

// Minutes counted for a play when Plex doesn't report a duration.
export const DEFAULT_MINUTES = { movie: 90, episode: 30, track: 3 };

// Top-list slides. from: what is ranked (movie, show, artist, track, screenGenre, musicGenre).
// audio: what plays under the slide: "theme" (show theme), "song" (the #1 track), "topSong" (the #1 artist's most played track). Leave out for silence.
export const RANKED = {
  movies: { from: "movie", title: "Your most watched movies", unit: "plays" },
  shows: {
    from: "show",
    title: "Shows you couldn’t stop",
    unit: "episodes",
    audio: "theme",
  },
  artists: {
    from: "artist",
    title: "Your top artists",
    unit: "plays",
    audio: "topSong",
  },
  tracks: { from: "track", title: "On repeat", unit: "plays", audio: "song" },
  screenGenres: {
    from: "screenGenre",
    title: "Your movie & TV genres",
    unit: "plays",
  },
  musicGenres: {
    from: "musicGenre",
    title: "Your music genres",
    unit: "plays",
  },
};

// The first rule whose metric reaches atLeast wins, so order matters.
// Metrics: binge (most episodes of one show in a day), night (share of viewing 10pm-4am), early (5am-10am),
// weekend, music, movie (shares from 0 to 1).
export const PERSONALITIES = [
  {
    metric: "night",
    atLeast: 0.4,
    title: "The Night Owl",
    line: "Your best viewing happens after dark.",
    trait: "After hours",
  },
  {
    metric: "early",
    atLeast: 0.3,
    title: "The Early Bird",
    line: "Play was pressed before most people were awake.",
    trait: "Morning person",
  },
  {
    metric: "weekend",
    atLeast: 0.55,
    title: "The Weekend Warrior",
    line: "You save the good stuff for the weekend.",
    trait: "Weekend regular",
  },
  {
    metric: "binge",
    atLeast: 8,
    title: "The Binge Machine",
    line: "Previously on... nothing. You watched it all in one sitting.",
    trait: "Marathoner",
  },
  {
    metric: "music",
    atLeast: 0.45,
    title: "The Soundtrack Machine",
    line: "Music was the main event.",
    trait: "Audiophile",
  },
  {
    metric: "movie",
    atLeast: 0.4,
    title: "The Cinephile",
    line: "Feature films were your thing.",
    trait: "Movie buff",
  },
];

export const FALLBACK_PERSONALITY = {
  title: "The Steady Streamer",
  line: "Balanced and consistent. Something was always playing.",
  trait: "Reliable",
};
