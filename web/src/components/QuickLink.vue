<script setup lang="ts">
import type { Component } from "vue";
defineProps<{ href: string; label: string; icon: Component }>();
</script>

<template>
  <a
    :href="href"
    :aria-label="label"
    :title="label"
    class="group flex size-11 items-center justify-center rounded-full text-text/40 transition-all duration-200 hover:bg-white/8 hover:text-text/90"
  >
    <component :is="icon" class="size-6 transition-transform duration-200" />
  </a>
</template>
