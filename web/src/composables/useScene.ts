//Scene sequence management for the rewind.

import { ref, computed, type Ref, readonly } from "vue";
import type { RewindData } from "@/types";

export interface SceneDefinition {
  id: string;
  name: string;
  priority: number;
  estimatedDuration?: number;
  icon?: string;
}

const movies = (s: RewindData): unknown[] =>
  (s.scenes["top-movies"] as unknown[] | undefined) ?? [];

export type SceneState = ReturnType<typeof useScene>;

export const useScene = (snapshot: Ref<RewindData | null>) => {
  const currentSceneIndex = ref(0);
  const isTransitioning = ref(false);

  const allScenes: SceneDefinition[] = [
    {
      id: "intro",
      name: "Intro",
      priority: 100,
      estimatedDuration: 3000,
      icon: "play",
    },
    {
      id: "top-movies",
      name: "Top Movies",
      priority: 90,
      estimatedDuration: 6000,
      icon: "film",
    },
  ];

  const visibleScenes = computed<SceneDefinition[]>(() => {
    const snap = snapshot.value;

    const generatedSceneIds = Object.keys(snap.scenes);

    const unknownScenes = generatedSceneIds.filter(
      (id) => !allScenes.some((scene) => scene.id === id),
    );

    if (unknownScenes.length > 0) {
      throw new Error(`Unknown rewind scene(s): ${unknownScenes.join(", ")}`);
    }

    const scenes = allScenes.filter(
      (scene) => scene.id === "intro" || generatedSceneIds.includes(scene.id),
    );

    return scenes.sort((a, b) => b.priority - a.priority);
  });

  const currentScene = computed(() => {
    const scenes = visibleScenes.value;
    return scenes[
      Math.min(currentSceneIndex.value, Math.max(scenes.length - 1, 0))
    ];
  });

  const totalScenes = computed(() => visibleScenes.value.length);
  const progress = computed(() => {
    if (totalScenes.value === 0) return 0;
    return (currentSceneIndex.value + 1) / totalScenes.value;
  });

  const hasNext = computed(
    () => currentSceneIndex.value < totalScenes.value - 1,
  );
  const hasPrev = computed(() => currentSceneIndex.value > 0);

  const next = () => {
    if (hasNext.value && !isTransitioning.value) {
      isTransitioning.value = true;
      currentSceneIndex.value++;
      setTimeout(() => (isTransitioning.value = false), 1600);
    }
  };

  const prev = () => {
    if (hasPrev.value && !isTransitioning.value) {
      isTransitioning.value = true;
      currentSceneIndex.value--;
      setTimeout(() => (isTransitioning.value = false), 1600);
    }
  };

  const goTo = (index: number) => {
    currentSceneIndex.value = Math.max(
      0,
      Math.min(index, totalScenes.value - 1),
    );
  };

  const getScene = (id: string) => allScenes.find((scene) => scene.id === id);

  return {
    currentSceneIndex: readonly(currentSceneIndex),
    visibleScenes,
    currentScene,
    totalScenes,
    progress,
    hasNext,
    hasPrev,
    isTransitioning: readonly(isTransitioning),
    next,
    prev,
    goTo,
    getScene,
    allScenes,
  };
};
