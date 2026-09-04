<script setup lang="ts">
import { RouterView } from "vue-router";
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden text-text">
    <div class="fixed inset-0 z-0 bg-background"></div>

    <RouterView />
  </div>
</template>
