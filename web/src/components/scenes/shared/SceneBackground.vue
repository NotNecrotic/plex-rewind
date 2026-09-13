<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  image: string;
}>();

const backgroundRef = ref<HTMLElement | null>(null);

defineExpose({
  element: backgroundRef,
});
</script>

<template>
  <div
    ref="backgroundRef"
    class="absolute inset-0 scale-[1.08] bg-cover bg-center"
    :style="{ backgroundImage: `url(${image})` }"
  >
    <!-- Darkens image -->
    <div
      class="absolute inset-0 bg-linear-to-b from-black/75 via-black/70 to-black/95"
    />
    <!-- Primary tint -->
    <div
      class="absolute inset-0 bg-[rgb(from_var(--color-primary)_r_g_b/10%)]"
    />
    <!-- Radial vignette -->
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgb(0_0_0/30%)_55%,rgb(0_0_0/80%)_100%)]"
    />
    <!-- Dark top -->
    <div
      class="absolute inset-x-0 top-0 h-1/3 bg-linear-to-b from-background via-background/45 to-transparent"
    />
    <!-- Dark bottom -->
    <div
      class="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background via-background/45 to-transparent"
    />
  </div>
</template>
