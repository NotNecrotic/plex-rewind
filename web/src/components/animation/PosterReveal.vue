<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMotion } from "../../composables/useMotion";

const props = withDefaults(
  defineProps<{
    poster?: string;
    backdrop?: string;
    title?: string;
    alt?: string;
    delay?: number;
    parallax?: boolean;
    size?: "sm" | "md" | "lg";
    rounded?: boolean;
  }>(),
  {
    poster: undefined,
    backdrop: undefined,
    title: "",
    alt: "",
    delay: 0,
    parallax: false,
    size: "md",
    rounded: true,
  },
);

const posterRef = ref<HTMLElement | null>(null);
const { popReveal } = useMotion();

onMounted(() => {
  if (!posterRef.value) return;

  if (props.delay > 0) {
    setTimeout(() => popReveal(posterRef.value!, props.delay), props.delay / 2);
  } else {
    popReveal(posterRef.value!);
  }
});

const sizeClasses = {
  sm: "w-48 h-auto",
  md: "w-64 h-auto",
  lg: "w-80 h-auto",
};
</script>

<template>
  <div ref="posterRef" class="relative inline-block" :class="sizeClasses[size]">
    <!-- Blurred backdrop (behind poster) -->
    <div
      v-if="backdrop"
      class="absolute inset-0 -z-10 rounded-xl overflow-hidden"
      :class="rounded ? 'rounded-xl' : 'rounded-none'"
      style="filter: blur(40px) brightness(0.4) saturate(150%)"
    >
      <img :src="backdrop" :alt="title" class="w-full h-full object-cover" />
    </div>

    <!-- Poster -->
    <div
      v-if="poster"
      class="relative rounded-xl overflow-hidden shadow-shadow-xl"
      :class="rounded ? 'rounded-xl' : 'rounded-none'"
    >
      <img
        :src="poster"
        :alt="alt || title"
        class="w-full h-full object-cover transition-transform duration-500"
        loading="eager"
      />
      <!-- Subtle gradient overlay at bottom -->
      <div
        class="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      ></div>
    </div>

    <!-- Fallback if no poster -->
    <div
      v-else
      class="flex items-center justify-center bg-surface border-2 border-dashed border-border rounded-xl"
      :style="{ aspectRatio: '2/3', minWidth: '160px' }"
    >
      <span class="text-text-tertiary text-center text-sm">{{ title }}</span>
    </div>

    <!-- Title overlay (optional) -->
    <div
      v-if="title"
      class="absolute -bottom-8 left-0 right-0 text-center text-sm font-medium text-text-secondary"
    >
      {{ title }}
    </div>
  </div>
</template>
