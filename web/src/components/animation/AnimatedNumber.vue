<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const props = withDefaults(
  defineProps<{
    value: number;
    active?: boolean;
    prefix?: string;
    suffix?: string;
    duration?: number;
    delay?: number;
    emphasize?: boolean;
  }>(),
  {
    prefix: "",
    suffix: "",
    duration: 800,
    delay: 0,
    emphasize: false,
  },
);

const el = ref<HTMLElement | null>(null);

const startAnimation = () => {
  if (props.delay > 0) {
    setTimeout(() => animateTo(props.value), props.delay);
  } else {
    animateTo(props.value);
  }
};

const playEmphasis = (element: HTMLElement) => {
  element.style.transition = "transform 0.3s ease-out";
  element.style.transform = "scale(1.1)";
  setTimeout(() => {
    element.style.transform = "scale(1)";
  }, 300);
};

const animateTo = (val: number) => {
  if (!el.value) return;

  const start = Number(el.value.textContent?.replace(/[^\d.-]/g, "")) || 0;
  const startTime = performance.now();

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / props.duration, 1);

    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (val - start) * eased;

    el.value!.textContent = `${props.prefix}${Math.round(current).toLocaleString()}${props.suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else if (props.emphasize) {
      playEmphasis(el.value!);
    }
  };

  requestAnimationFrame(tick);
};

onMounted(() => {
  if (props.active) {
    startAnimation();
  }
});

watch(
  () => props.value,
  (newVal) => {
    if (props.active) {
      animateTo(newVal);
    }
  },
);

watch(
  () => props.active,
  (active) => {
    if (active) {
      startAnimation();
    }
  },
);
</script>

<template>
  <span
    ref="el"
    class="font-display font-black tabular-nums"
    :class="{ 'text-gradient': emphasize }"
  ></span>
</template>
