<script setup lang="ts">
import { computed, defineAsyncComponent, type Component, watch } from "vue";
import { useRoute } from "vue-router";
import { useRewind } from "../composables/useRewind";
import { useScene } from "../composables/useScene";
import { useAuth } from "../services/auth";

const route = useRoute();

const rewindId = computed(() => (route.params.rewindId as string) || "2026");

const { rewind, loading, error, loadRewind } = useRewind();
const sceneMeta = useScene(rewind);
const user = useAuth().user;
const sceneComponents: Record<string, Component> = {
  intro: defineAsyncComponent(
    () => import("../components/scenes/IntroScene.vue"),
  ),
  "top-movies": defineAsyncComponent(
    () => import("../components/scenes/TopMovies.vue"),
  ),
};

const visible = computed(() => sceneMeta.visibleScenes.value);

function componentFor(id: string): Component {
  const component = sceneComponents[id];

  if (!component) {
    throw new Error(`Unknown sceneMeta: ${id}`);
  }

  return component;
}

watch(
  rewindId,
  async (id) => {
    await loadRewind(id);
    sceneMeta.goTo(0);
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="loading" class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div
        class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
      <p class="text-text-secondary">Loading your Rewind...</p>
    </div>
  </div>

  <div v-else-if="error" class="flex min-h-screen items-center justify-center">
    <p class="text-error">Failed to load Rewind: {{ error }}</p>
  </div>

  <div
    v-else-if="rewind"
    class="relative h-screen w-full overflow-hidden bg-cinematic"
  >
    <div
      ref="container"
      class="h-screen w-full snap-y snap-mandatory overflow-y-auto"
    >
      <section
        v-for="(sceneDef, index) in visible"
        :key="sceneDef.id"
        :data-sceneMeta-index="index"
        class="relative min-h-screen w-full snap-start"
      >
        <component
          :is="componentFor(sceneDef.id)"
          :rewind="rewind"
          :sceneMeta="sceneMeta"
          :user="user"
          class="min-h-screen w-full"
        />
      </section>
    </div>
  </div>
</template>
