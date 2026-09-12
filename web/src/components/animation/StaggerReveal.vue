<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { useMotion } from "../../composables/useMotion";

const props = withDefaults(
  defineProps<{
    delay?: number;
    duration?: number;
    stagger?: number;
    childrenSelector?: string;
  }>(),
  {
    delay: 0,
    duration: 600,
    stagger: 60,
    childrenSelector: "> *",
  },
);

const containerRef = ref<HTMLElement | null>(null);
const { staggerReveal } = useMotion();

onMounted(async () => {
  await nextTick();
  if (!containerRef.value) return;

  const children = containerRef.value.querySelectorAll<HTMLElement>(
    props.childrenSelector,
  );

  staggerReveal(children, {
    delay: props.delay,
    durationMs: props.duration,
  });
});
</script>

<template>
  <div ref="containerRef">
    <slot />
  </div>
</template>
