<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useMotion } from "../../composables/useMotion";

const props = withDefaults(
  defineProps<{
    value: number;
    prefix?: string;
    suffix?: string;
    format?: "compact" | "full";
    duration?: number;
    delay?: number;
    emphasize?: boolean;
  }>(),
  {
    prefix: "",
    suffix: "",
    format: "full",
    duration: 800,
    delay: 0,
    emphasize: false,
  },
);

const el = ref<HTMLElement | null>(null);
const { animateNumber } = useMotion();

const playEmphasis = (element: HTMLElement) => {
  element.style.transition = "transform 0.3s ease-out";
  element.style.transform = "scale(1.1)";
  setTimeout(() => {
    element.style.transform = "scale(1)";
  }, 300);
};

const animateTo = (val: number) => {
  if (!el.value) return;
  animateNumber(el.value, val, {
    prefix: props.prefix,
    suffix: props.suffix,
    format: props.format,
    durationMs: props.duration,
    onComplete: props.emphasize ? () => playEmphasis(el.value!) : undefined,
  });
};

onMounted(() => {
  if (props.delay > 0) {
    setTimeout(() => animateTo(props.value), props.delay);
  } else {
    animateTo(props.value);
  }
});

watch(
  () => props.value,
  (newVal) => {
    animateTo(newVal);
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
