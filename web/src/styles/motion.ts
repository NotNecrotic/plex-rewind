import type { Easing } from "@motionone/types";

export const easing = {
  // Standard smooth easing for transitions
  smooth: [0.25, 0.1, 0.25, 1],
  // Expressive easing for dramatic reveals
  emphatic: [0.2, 0.8, 0.2, 1],
  // Snappy for interactive elements
  snappy: [0.4, 0, 0.2, 1.3],
  // Gentle easing for subtle movement
  gentle: [0.19, 1, 0.2, 1],
} as const satisfies Record<string, Easing>;

export const duration = {
  instant: 150,
  fast: 250,
  base: 400,
  numberReveal: 400,
  slow: 600,
  cinematic: 1000,
  epic: 1600,
} as const;

export const delay = {
  betweenScenes: 200,
  betweenNumbers: 300,
  betweenLines: 250,
  betweenStaggers: 80,
  initial: 300,
} as const;

export const stagger = {
  dense: 0.03,
  base: 0.06,
  loose: 0.1,
  numbers: 0.25,
} as const;

export const variants = {
  // Fade + scale up (for cards, posters)
  scaleIn: {
    initial: { opacity: 0, scale: 0.95, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 },
  },

  // Fade in from bottom (for text lines)
  slideUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },

  // Simple fade (for overlays)
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  // For staggered children reveals
  child: {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
  },
} as const;

export const timing = {
  posterReveal: duration.slow, // 600ms for poster entrance
  textReveal: duration.cinematic, // 1000ms for headline
  numberReveal: duration.base, // 400ms for stat counting
  sceneTransition: duration.epic, // 1600ms for scene change
  staggerItem: 150, // per staggered item
  parallaxMax: 30, // max px offset for parallax
} as const;

/** Whether the current device prefers reduced motion. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
