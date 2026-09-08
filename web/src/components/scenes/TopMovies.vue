<script setup lang="ts">
import { computed } from "vue";
import type { RewindData, TopMovieEntry } from "@/types";
import { artworkUrl } from "../../services/api";

const props = defineProps<{
  snapshot: RewindData;
  scene: Record<string, any>;
}>();

const movies = computed<TopMovieEntry[]>(
  () =>
    (props.snapshot.scenes["top-movies"] as TopMovieEntry[] | undefined) ?? [],
);
const topMovie = computed(() => movies.value[0]);
</script>

<template>
  <div>
    <div :style="{ backgroundImage: `url(${artworkUrl(topMovie.thumb)})` }">
      <div></div>
    </div>
  </div>
</template>
