<script setup lang="ts">
import { computed } from "vue";
import type { RewindData, TopMovieEntry } from "@/types";
import { assetUrl } from "../../services/api";

const props = defineProps<{
  rewind: RewindData;
  sceneMeta: Record<string, any>;
}>();

const movies = computed<TopMovieEntry[]>(
  () =>
    (props.rewind.scenes["top-movies"] as TopMovieEntry[] | undefined) ?? [],
);
const topMovie = computed(() => movies.value[0]);
</script>

<template>
  <div>
    <div
      :style="{
        backgroundImage: `url(${assetUrl(topMovie.thumb, rewind.rewind.year)})`,
      }"
    >
      <div></div>
    </div>
  </div>
</template>
