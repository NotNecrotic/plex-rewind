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
    <div
      class="absolute inset-0 bg-gradient-to-b from-black/75 via-black/70 to-black/95"
    />
    <div
      class="absolute inset-0 bg-[rgb(from_var(--color-primary)_r_g_b_/_10%)]"
    />
    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgb(0_0_0_/_30%)_55%,rgb(0_0_0_/_80%)_100%)]"
    />
    <div
      class="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background/80 to-transparent"
    />
    <div
      class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/45 to-transparent"
    />
  </div>
</template>
