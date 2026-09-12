import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type Ref,
} from "vue";
import { gsap } from "gsap";
import type { RewindData } from "@/types";
import type { SceneState } from "./useScene";

export interface SceneBodyItem {
  // Element that slides in during the final reveal.
  ref: Ref<HTMLElement | null>;
  // Distance (px) the element slides up from. Defaults to 45.
  y?: number;
  // Slide-in duration in seconds. Defaults to 0.95.
  duration?: number;
  // Timeline position. Defaults to "-=0.45".
  at?: string;
}

export interface SceneStaggerGroup {
  // Resolves the children to stagger (poster tiles / stat cards).
  items: () => NodeListOf<HTMLElement> | HTMLElement[];
  // From-vars of the staggered reveal (e.g. { opacity: 0, scale: 0.9 }).
  from: gsap.TweenVars;
  // To-vars, including `stagger` and `duration`.
  to: gsap.TweenVars;
  // Timeline position.
  at: string;
}

export interface SceneAnimationConfig {
  // Scene id within `rewind.scenes`.
  sceneId: string;
  rewind: RewindData;
  sceneMeta: SceneState;
  // The opening "beat" labels.
  beat1: Ref<HTMLElement | null>;
  beat2: Ref<HTMLElement | null>;
  // The hero block that fills the screen, then lifts away.
  hero: Ref<HTMLElement | null>;
  // The hero's resting pose after the climax.
  heroFinal: { y: string | number; scale: number };
  // The content inside the hero.
  heroContent: Ref<HTMLElement | null>;
  // Sections revealed after the hero lands.
  body?: SceneBodyItem[];
  // Children inside `body` that stagger in.
  staggerGroup?: SceneStaggerGroup;
  // Blurred backdrop component instance.
  background?: Ref<{ element: HTMLElement | null } | null>;
  // When false, the scene never animates.
  requires?: () => boolean;
}

export interface SceneAnimation {
  playAnimation: () => void;
  resetAnimation: () => void;
}

export const useSceneAnimation = (
  options: SceneAnimationConfig,
): SceneAnimation => {
  const { sceneId, rewind, sceneMeta, beat1, beat2, hero, heroContent } =
    options;

  const heroFinal = options.heroFinal;
  const body = options.body ?? [];
  const staggerGroup = options.staggerGroup;
  const background = options.background;
  const requires = options.requires ?? (() => true);

  const hasCompleted = ref(false);

  let ctx: gsap.Context | null = null;
  let timeline: gsap.core.Timeline | null = null;

  const backdrop = () => background?.value?.element;

  function setInitialState() {
    gsap.set([beat1.value, beat2.value].filter(Boolean), {
      autoAlpha: 0,
    });

    if (hero.value) {
      gsap.set(hero.value, { y: 0, scale: 1 });
    }

    if (heroContent.value) {
      gsap.set(heroContent.value, { y: 40, scale: 1, opacity: 0 });
    }

    for (const item of body) {
      if (item.ref.value) {
        gsap.set(item.ref.value, {
          autoAlpha: 0,
          y: item.y ?? 45,
        });
      }
    }

    const element = backdrop();

    if (element) {
      gsap.set(element, { opacity: 0, scale: 1.08 });
    }
  }

  function setFinalState() {
    gsap.set([beat1.value, beat2.value].filter(Boolean), {
      autoAlpha: 0,
    });

    if (hero.value) {
      gsap.set(hero.value, { y: heroFinal.y, scale: heroFinal.scale });
    }

    if (heroContent.value) {
      gsap.set(heroContent.value, { y: 0, scale: 1, opacity: 1 });
    }

    for (const item of body) {
      if (item.ref.value) {
        gsap.set(item.ref.value, { autoAlpha: 1, y: 0 });
      }
    }

    if (staggerGroup) {
      gsap.set(staggerGroup.items(), { opacity: 1, y: 0, scale: 1 });
    }

    const element = backdrop();

    if (element) {
      gsap.set(element, { opacity: 0.5, scale: 1 });
    }
  }

  function playAnimation() {
    if (!requires()) return;

    if (hasCompleted.value) {
      setFinalState();
      return;
    }

    if (!beat1.value || !beat2.value || !hero.value) return;

    timeline?.kill();

    gsap.set([beat1.value, beat2.value].filter(Boolean), {
      autoAlpha: 0,
    });

    gsap.set(beat1.value, { autoAlpha: 1 });

    gsap.set(hero.value, { y: 0, scale: 1 });

    gsap.set(heroContent.value, { y: 40, opacity: 0 });

    for (const item of body) {
      if (item.ref.value) {
        gsap.set(item.ref.value, { autoAlpha: 0, y: item.y ?? 45 });
      }
    }

    const backgroundElement = backdrop();

    timeline = gsap.timeline({
      defaults: {
        ease: "power3.out",
      },
      onComplete: () => {
        hasCompleted.value = true;
      },
    });

    timeline
      .fromTo(
        beat1.value,
        { autoAlpha: 0, y: 45 },
        { autoAlpha: 1, y: 0, duration: 1.15 },
      )
      .to({}, { duration: 2 })
      .to(beat1.value, {
        autoAlpha: 0,
        y: -30,
        duration: 0.8,
        ease: "power2.inOut",
      })
      .fromTo(
        beat2.value,
        { autoAlpha: 0, y: 35 },
        { autoAlpha: 1, y: 0, duration: 1 },
        "<0.25",
      )
      .to({}, { duration: 1.8 })
      .to(beat2.value, {
        autoAlpha: 0,
        y: -30,
        duration: 0.8,
        ease: "power2.inOut",
      })
      .to(hero.value, { autoAlpha: 1, duration: 0.01 }, "<");

    if (backgroundElement) {
      timeline.to(
        backgroundElement,
        {
          opacity: 0.5,
          scale: 1,
          duration: 1.5,
          ease: "power2.out",
        },
        "<",
      );
    }

    timeline
      .fromTo(
        heroContent.value,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 1.2 },
        "<",
      )
      .to({}, { duration: 2.8 })
      .to(hero.value, {
        y: heroFinal.y,
        scale: heroFinal.scale,
        duration: 1.15,
        ease: "power3.inOut",
      });

    for (const item of body) {
      if (item.ref.value) {
        timeline.fromTo(
          item.ref.value,
          { autoAlpha: 0, y: item.y ?? 45 },
          { autoAlpha: 1, y: 0, duration: item.duration ?? 0.95 },
          item.at ?? "-=0.45",
        );
      }
    }

    if (staggerGroup) {
      timeline.fromTo(
        staggerGroup.items(),
        staggerGroup.from,
        staggerGroup.to,
        staggerGroup.at,
      );
    }
  }

  function resetAnimation() {
    hasCompleted.value = false;
    timeline?.kill();
    timeline = null;
    setInitialState();
  }

  const sceneIndex = computed(() =>
    Object.keys(rewind.scenes).indexOf(sceneId),
  );

  const isActive = computed(
    () => sceneMeta.currentSceneIndex.value === sceneIndex.value,
  );

  const stopWatchingActive = watch(
    isActive,
    (active) => {
      if (active) {
        nextTick(playAnimation);
      } else if (!hasCompleted.value) {
        resetAnimation();
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    ctx = gsap.context(() => {
      setInitialState();
    });
  });

  onUnmounted(() => {
    stopWatchingActive();
    timeline?.kill();
    ctx?.revert();
  });

  return {
    playAnimation,
    resetAnimation,
  };
};
