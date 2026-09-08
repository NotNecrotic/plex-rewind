<script setup lang="ts">
/**
 * SplitText — Splits text into individual character spans and
 * animates them sequentially using GSAP's stagger.
 *
 * Usage:
 *   <SplitText text="A LOT." tag="h1" delay="500" />
 *   <SplitText :text="snapshot.intro.title" tag="h2" />
 */
import { ref, onMounted, computed } from "vue";
import { gsap } from "gsap";

const props = withDefaults(
  defineProps<{
    text: string;
    tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
    split?: "chars" | "words";
    delay?: number;
    stagger?: number;
    duration?: number;
    className?: string;
    yOffset?: number;
  }>(),
  {
    tag: "h1",
    split: "chars",
    delay: 0,
    stagger: 0.04,
    duration: 1000,
    className: "",
    yOffset: 24,
  },
);

const containerRef = ref<HTMLElement | null>(null);

const parts = computed(() => {
  if (props.split === "words") return props.text.split(" ");
  return props.text.split("");
});

onMounted(() => {
  if (!containerRef.value) return;

  const spans = containerRef.value.querySelectorAll("span");

  gsap.from(spans, {
    opacity: 0,
    y: props.yOffset,
    stagger: { each: props.stagger, from: "start" },
    duration: props.duration / 1000,

    delay: props.delay / 1000,
  });
});
</script>

<template>
  <component :is="tag" ref="containerRef" :class="className">
    <span
      v-for="(part, i) in parts"
      :key="`${part}-${i}`"
      class="inline-block"
      style="white-space: pre"
    >
      {{ part }}
    </span>
  </component>
</template>
