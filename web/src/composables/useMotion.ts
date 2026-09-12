import { gsap } from "gsap";
import {
  easing,
  duration,
  stagger as staggerConfig,
  prefersReducedMotion,
} from "../styles/motion";
import { ref, readonly, onMounted, onUnmounted } from "vue";

const toGsapEase = (curve: readonly number[]): string => {
  const c = curve as number[];
  return `cubic-bezier(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
};

export const useMotion = () => {
  const prefersReduced = ref(prefersReducedMotion());

  const checkMotionPref = () => {
    prefersReduced.value = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  };

  onMounted(() => {
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .addEventListener("change", checkMotionPref);
  });
  onUnmounted(() => {
    window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .removeEventListener("change", checkMotionPref);
  });

  const animateNumber = (
    element: HTMLElement,
    target: number,
    options?: {
      durationMs?: number;
      prefix?: string;
      suffix?: string;
      format?: "compact" | "full";
      onComplete?: () => void;
    },
  ) => {
    if (prefersReduced.value) {
      element.textContent = formatNumber(target, options);
      options?.onComplete?.();
      return;
    }

    const obj = { val: 0 };
    const dur = (options?.durationMs ?? duration.numberReveal) / 1000;

    gsap.to(obj, {
      val: target,
      duration: dur,
      ease: toGsapEase(easing.emphatic),
      onUpdate: () => {
        element.textContent = formatNumber(obj.val, options);
      },
      onComplete: options?.onComplete,
    });
  };

  const staggerReveal = (
    children: NodeListOf<HTMLElement> | HTMLElement[],
    options?: {
      delay?: number;
      durationMs?: number;
    },
  ) => {
    if (prefersReduced.value) {
      children.forEach((c) => {
        c.style.opacity = "1";
        c.style.transform = "translateY(0)";
      });
      return gsap.timeline();
    }

    const dur = (options?.durationMs ?? duration.base) / 1000;
    const startDelay = (options?.delay ?? 0) / 1000;

    return gsap.from(children as HTMLElement[], {
      opacity: 0,
      y: 30,
      stagger: { each: staggerConfig.base, from: "start" },
      duration: dur,
      ease: toGsapEase(easing.emphatic),
      delay: startDelay,
    });
  };

  const lineReveal = (
    elements: HTMLElement[],
    options?: {
      baseDelay?: number;
      perItemDelay?: number;
      durationMs?: number;
    },
  ) => {
    if (prefersReduced.value) {
      elements.forEach((e) => {
        e.style.opacity = "1";
        e.style.transform = "translateY(0)";
      });
      return gsap.timeline();
    }

    elements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
    });

    const base = (options?.baseDelay ?? 0) / 1000;
    const perItem = (options?.perItemDelay ?? staggerConfig.numbers) / 1000;
    const dur = (options?.durationMs ?? duration.cinematic) / 1000;

    const tl = gsap.timeline();

    elements.forEach((el, i) => {
      tl.to(
        el,
        {
          opacity: 1,
          y: 0,
          duration: dur,
          ease: toGsapEase(easing.emphatic),
        },
        base + i * perItem,
      );
    });

    return tl;
  };

  const createTimeline = (onComplete?: () => void) => {
    return gsap.timeline({
      paused: true,
      defaults: {
        duration: duration.base / 1000,
        ease: toGsapEase(easing.smooth),
      },
      onComplete,
    });
  };

  const parallaxHover = (
    element: HTMLElement,
    maxOffset = 30,
    intensity = 0.5,
  ) => {
    if (prefersReduced.value) return () => {};

    const handleMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      gsap.to(element, {
        transform: `translate(${
          x * maxOffset * intensity
        }px, ${y * maxOffset * intensity}px)`,
        duration: 0.3,
        ease: toGsapEase(easing.gentle),
      });
    };

    const handleLeave = () => {
      gsap.to(element, {
        transform: "translate(0px, 0px)",
        duration: 0.6,
        ease: toGsapEase(easing.gentle),
      });
    };

    element.addEventListener("mousemove", handleMove);
    element.addEventListener("mouseleave", handleLeave);

    return () => {
      element.removeEventListener("mousemove", handleMove);
      element.removeEventListener("mouseleave", handleLeave);
    };
  };

  const popReveal = (element: HTMLElement, delayMs = 0) => {
    if (prefersReduced.value) {
      element.style.opacity = "1";
      element.style.scale = "1";
      return;
    }

    gsap.from(element, {
      opacity: 0,
      scale: 1.05,
      duration: (duration.slow / 1000) * 0.8,
      ease: toGsapEase(easing.emphatic),
      delay: delayMs / 1000,
    });
  };

  const fadeBlurReveal = (element: HTMLElement, delayMs = 0) => {
    if (prefersReduced.value) {
      element.style.opacity = "1";
      element.style.filter = "blur(0px)";
      return;
    }

    gsap.from(element, {
      opacity: 0,
      filter: "blur(12px)",
      duration: duration.slow / 1000,
      ease: toGsapEase(easing.gentle),
      delay: delayMs / 1000,
    });
  };

  return {
    easing,
    duration,
    stagger: staggerConfig,
    prefersReduced: readonly(prefersReduced),
    animateNumber,
    staggerReveal,
    lineReveal,
    createTimeline,
    parallaxHover,
    popReveal,
    fadeBlurReveal,
    toGsapEase,
  };
};

function formatNumber(
  v: number,
  options?: { format?: string; prefix?: string; suffix?: string },
): string {
  const prefix = options?.prefix ?? "";
  const suffix = options?.suffix ?? "";

  if (options?.format === "compact") {
    if (v >= 1000000) return `${prefix}${(v / 1000000).toFixed(1)}M${suffix}`;
    if (v >= 1000) return `${prefix}${(v / 1000).toFixed(1)}K${suffix}`;
  }

  return `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
}
