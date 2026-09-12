// Manages scene states and navigation

import { computed, ref, readonly, type Ref } from "vue";
import type { RewindData } from "@/types";

export interface SceneDefinition {
  id: string;
  name: string;
}

export type SceneState = ReturnType<typeof useScene>;

export const useScene = (rewind: Ref<RewindData | null>) => {
  const currentSceneIndex = ref(0);

  const visibleScenes = computed<SceneDefinition[]>(() => {
    const snapshot = rewind.value;

    if (!snapshot) return [];

    const generatedSceneIds = Object.keys(snapshot.scenes);

    return generatedSceneIds.map((id) => ({
      id,
      name: id,
    }));
  });

  const currentScene = computed(() => {
    return visibleScenes.value[currentSceneIndex.value] ?? null;
  });

  const totalScenes = computed(() => visibleScenes.value.length);

  const hasNext = computed(
    () => currentSceneIndex.value < totalScenes.value - 1,
  );

  const hasPrev = computed(() => currentSceneIndex.value > 0);

  function next() {
    if (hasNext.value) {
      currentSceneIndex.value++;
    }
  }

  function prev() {
    if (hasPrev.value) {
      currentSceneIndex.value--;
    }
  }

  function goTo(index: number) {
    if (totalScenes.value === 0) return;

    currentSceneIndex.value = Math.max(
      0,
      Math.min(index, totalScenes.value - 1),
    );
  }

  return {
    currentSceneIndex: readonly(currentSceneIndex),
    visibleScenes,
    currentScene,
    totalScenes,
    hasNext,
    hasPrev,
    next,
    prev,
    goTo,
  };
};
