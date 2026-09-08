import { ref, computed } from "vue";
import { api } from "../services/api";
import type { RewindData } from "@/types";

export const useRewind = () => {
  const rewind = ref<RewindData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadRewind = async (rewindId: string) => {
    loading.value = true;
    error.value = null;
    try {
      rewind.value = await api.getRewind(rewindId);
    } catch (e) {
      error.value = (e as Error).message;
      rewind.value = null;
    } finally {
      loading.value = false;
    }
  };

  return {
    rewind,
    loading,
    error,
    loadRewind,
    user: computed(() => rewind.value?.user ?? null),
    meta: computed(() => rewind.value?.rewind ?? null),
    scenes: computed(() => rewind.value?.scenes ?? {}),
  };
};
