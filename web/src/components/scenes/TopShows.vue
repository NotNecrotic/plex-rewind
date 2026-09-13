<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import type { RewindData, TopShowsScene } from "@/types";
import PosterReveal from "../../components/animation/PosterReveal.vue";
import StaggerReveal from "../../components/animation/StaggerReveal.vue";
import AnimatedNumber from "../../components/animation/AnimatedNumber.vue";
import { assetUrl } from "../../services/api";
import SceneBackground from "./shared/SceneBackground.vue";
import type { SceneState } from "../../composables/useScene";
import { useSceneAnimation } from "../../composables/useSceneAnimation";
import { useSceneAudio } from "../../composables/useSceneAudio.ts";

const props = defineProps<{
  rewind: RewindData;
  sceneMeta: SceneState;
}>();

const topShowsScene = computed(
  () => props.rewind.scenes["top-shows"] as TopShowsScene,
);

const shows = computed(() => topShowsScene.value.shows);

const topShow = computed(() => shows.value[0]);
const otherShows = computed(() => shows.value.slice(1, 5));
const totalShows = computed(() => topShowsScene.value.totalShows);
const totalEpisodes = computed(() => topShowsScene.value.totalEpisodes);
const year = computed(() => props.rewind.rewind.year);

const backgroundImage = computed(() =>
  topShowsScene.value.background
    ? assetUrl(topShowsScene.value.background, year.value)
    : null,
);

const beat1Ref = ref<HTMLElement | null>(null);
const beat2Ref = ref<HTMLElement | null>(null);
const beat3Ref = ref<HTMLElement | null>(null);
const heroRef = ref<HTMLElement | null>(null);
const heroContentRef = ref<HTMLElement | null>(null);
const otherShowsRef = ref<HTMLElement | null>(null);
const finalLabelRef = ref<HTMLElement | null>(null);
const backgroundComponentRef = ref<InstanceType<typeof SceneBackground> | null>(
  null,
);

const isBeat2Active = computed(() => anim.activeBeat.value === 2);

const anim = useSceneAnimation({
  sceneId: "top-shows",
  rewind: props.rewind,
  sceneMeta: props.sceneMeta,
  beat1: beat1Ref,
  beat2: beat2Ref,
  beat3: beat3Ref,
  hero: heroRef,
  heroContent: heroContentRef,
  heroFinal: { y: "-20vh", scale: 0.68 },
  body: [
    { ref: finalLabelRef, y: 25, duration: 0.7, at: "-=0.65" },
    { ref: otherShowsRef, y: 45, duration: 0.95, at: "-=0.45" },
  ],
  background: backgroundComponentRef,
});

const themeUrl = computed(() =>
  assetUrl(topShowsScene.value.theme, year.value),
);

const {
  play: playTheme,
  stop: stopTheme,
  unlock: unlockTheme,
} = useSceneAudio(themeUrl, {
  volume: 0.2,
  fadeIn: 1200,
  fadeOut: 2000,
});

watch(anim.activeBeat, (beat) => {
  if (beat === 4) {
    playTheme();
  }
});

watch(
  () => props.sceneMeta.currentScene.value.id,
  (scene) => {
    if (scene !== "top-shows") {
      stopTheme();
    }
  },
);

defineExpose({
  resetAnimation: anim.resetAnimation,
});

onMounted(() => {
  window.addEventListener("rewind-start", unlockTheme);
});

onUnmounted(() => {
  window.removeEventListener("rewind-start", unlockTheme);
});
</script>

<template>
  <section class="relative h-full min-h-screen w-full overflow-hidden">
    <SceneBackground
      v-if="backgroundImage"
      ref="backgroundComponentRef"
      :image="backgroundImage"
    />

    <!-- Beat 1 — introduction -->
    <div
      ref="beat1Ref"
      class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
    >
      <h2
        class="max-w-[90vw] text-2xl font-display font-black uppercase leading-[0.95] tracking-tight text-gradient sm:text-5xl md:text-4xl lg:text-5xl"
      >
        Next up, the small screen...
      </h2>
    </div>

    <!-- Beat 2 — show stats -->
    <div
      ref="beat2Ref"
      class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
    >
      <div class="flex flex-col items-center">
        <span
          class="text-base font-display font-bold uppercase tracking-[0.14em] text-white sm:text-xl md:text-2xl"
        >
          You watched
        </span>

        <AnimatedNumber
          :active="isBeat2Active"
          :value="totalEpisodes"
          :duration="1800"
          :delay="350"
          :emphasize="true"
          class="mt-2 mb-4 bg-linear-to-r from-primary to-secondary bg-clip-text text-7xl font-display font-black leading-none text-transparent sm:text-9xl md:text-[10rem]"
        />

        <span
          class="text-base font-display font-bold uppercase tracking-[0.14em] text-white sm:text-xl md:text-2xl"
        >
          episodes from <br />{{ totalShows }} shows this year.
        </span>
      </div>
    </div>

    <!-- Beat 3 — favorites -->
    <div
      ref="beat3Ref"
      class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
    >
      <div class="max-w-5xl">
        <h2
          class="max-w-[90vw] text-2xl font-display font-black uppercase leading-[0.95] tracking-tight text-gradient sm:text-5xl md:text-4xl lg:text-5xl"
        >
          And you had some favorites you couldn't stop watching...
        </h2>
      </div>
    </div>

    <div
      ref="heroRef"
      class="absolute inset-0 z-10 flex items-start pt-[14vh] sm:items-center sm:pt-0 justify-center overflow-y-auto px-5 py-16 sm:px-6 sm:py-20"
    >
      <div
        v-if="topShow"
        ref="heroContentRef"
        class="flex w-full max-w-6xl flex-col items-center justify-center gap-6 text-center sm:gap-10 md:flex-row md:gap-20 md:text-left"
      >
        <div class="relative shrink-0">
          <div
            class="absolute -inset-8 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgb(from_var(--color-primary)_r_g_b_/_25%),transparent_70%)] blur-2xl"
          />

          <div class="relative">
            <PosterReveal
              v-if="topShow.thumb"
              :poster="assetUrl(topShow.thumb, year) ?? undefined"
              size="lg"
              class="max-w-[30vh] sm:max-w-none"
            />
          </div>
        </div>

        <div class="max-w-2xl">
          <p
            class="text-xl font-display font-black uppercase tracking-[0.25em] text-primary md:text-3xl"
          >
            Your #1 show
          </p>

          <h1
            class="mt-3 sm:mt-4 text-4xl font-display font-black leading-[0.9] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {{ topShow.title }}
          </h1>

          <div
            class="mt-3 sm:mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-text-secondary md:justify-start md:text-base"
          >
            <span class="text-xl font-bold text-white/80 md:text-2xl">
              {{ topShow.episodes }}
              {{ topShow.episodes === 1 ? "episode" : "episodes" }}
            </span>
            <span class="text-white/80">from</span>
            <span class="text-xl font-bold text-white/80 md:text-2xl">
              {{ topShow.seasons }}
              {{ topShow.seasons === 1 ? "season" : "seasons" }}
            </span>
          </div>

          <p
            class="mx-auto mt-5 hidden max-w-lg text-base leading-relaxed text-white/60 sm:block sm:text-lg md:mx-0 md:text-xl"
          >
            Out of everything you watched, this one owned your screen.
          </p>
        </div>
      </div>
    </div>

    <div
      ref="finalLabelRef"
      class="absolute inset-x-0 bottom-[5vh] z-20 px-4 sm:bottom-[7vh] sm:px-6"
    ></div>

    <div ref="otherShowsRef" class="absolute inset-x-0 bottom-[7vh] z-20 px-6">
      <div class="mx-auto w-full max-w-4xl">
        <StaggerReveal :delay="100" :duration="650">
          <div
            class="mx-auto grid gap-3 sm:gap-6 md:gap-10"
            :class="
              otherShows.length <= 2
                ? 'grid-cols-2 w-fit'
                : 'grid-cols-2 w-fit sm:grid-cols-4'
            "
          >
            <div
              v-for="show in otherShows"
              :key="show.ratingKey ?? show.rank"
              class="group min-w-0"
            >
              <div
                class="relative mx-auto aspect-2/3 w-full max-w-[clamp(4rem,11vh,10rem)] sm:max-w-[150px] overflow-hidden rounded-lg border border-border shadow-2xl"
              >
                <img
                  v-if="show.thumb"
                  :src="assetUrl(show.thumb, year) ?? undefined"
                  :alt="show.title"
                  class="h-full w-full object-cover"
                  loading="eager"
                />

                <div
                  v-else
                  class="grid h-full w-full place-items-center p-3 text-center text-xs text-text-secondary"
                >
                  {{ show.title }}
                </div>

                <div
                  class="absolute left-0.5 top-0.5 flex size-6 items-center justify-center rounded-full bg-black/65 text-[10px] font-display font-black text-white backdrop-blur-md border border-border sm:left-2 sm:top-2 sm:size-7 sm:text-xs"
                >
                  #{{ show.rank }}
                </div>
              </div>

              <div class="mx-auto mt-1 max-w-[150px] text-center">
                <h3
                  class="truncate text-sm font-display font-bold text-white"
                  :title="show.title"
                >
                  {{ show.title }}
                </h3>
              </div>
            </div>
          </div>
        </StaggerReveal>
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-32 bg-linear-to-t from-background to-transparent"
    />
  </section>
</template>
