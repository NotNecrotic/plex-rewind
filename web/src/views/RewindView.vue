<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onBeforeUnmount,
  ref,
  type Component,
  type ComponentPublicInstance,
  watch,
} from "vue";
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
  "top-shows": defineAsyncComponent(
    () => import("../components/scenes/TopShows.vue"),
  ),
};

const visible = computed(() => sceneMeta.visibleScenes.value);

const containerRef = ref<HTMLElement | null>(null);
const sectionRefs = ref<Record<number, HTMLElement>>({});

function sectionRefFor(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    if (el) {
      sectionRefs.value[index] = el as HTMLElement;
    } else {
      delete sectionRefs.value[index];
    }
  };
}

let sceneObserver: IntersectionObserver | null = null;

function setupSceneObserver() {
  sceneObserver?.disconnect();

  const container = containerRef.value;

  if (!container) return;

  sceneObserver = new IntersectionObserver(
    (entries) => {
      const intersecting = entries.filter((entry) => entry.isIntersecting);

      if (intersecting.length === 0) return;

      const dominant = intersecting.reduce((a, b) =>
        b.intersectionRatio > a.intersectionRatio ? b : a,
      );

      const index = Number((dominant.target as HTMLElement).dataset.sceneIndex);

      if (!Number.isNaN(index)) {
        sceneMeta.goTo(index);
      }
    },
    {
      root: container,
      threshold: [0.1, 0.25, 0.5, 0.75, 0.9],
    },
  );

  for (const [index, section] of Object.entries(sectionRefs.value)) {
    section.dataset.sceneIndex = index;
    sceneObserver.observe(section);
  }
}

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
    nextTick(setupSceneObserver);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  sceneObserver?.disconnect();
  sceneObserver = null;
});
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
      ref="containerRef"
      class="h-screen w-full snap-y snap-mandatory overflow-y-auto"
    >
      <section
        v-for="(sceneDef, index) in visible"
        :key="sceneDef.id"
        :ref="sectionRefFor(index)"
        :data-scene-index="index"
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
