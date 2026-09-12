<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import type { RewindData, TopMoviesScene } from "@/types";
import { gsap } from "gsap";
import PosterReveal from "../../components/animation/PosterReveal.vue";
import StaggerReveal from "../../components/animation/StaggerReveal.vue";
import AnimatedNumber from "../../components/animation/AnimatedNumber.vue";
import { assetUrl } from "../../services/api";
import SceneBackground from "./shared/SceneBackground.vue";
import type { SceneState } from "../../composables/useScene";

const props = defineProps<{
  rewind: RewindData;
  sceneMeta: SceneState;
}>();

const topMovies = computed(
  () => props.rewind.scenes["top-movies"] as TopMoviesScene,
);

const movies = computed(() => topMovies.value.movies);

const topMovie = computed(() => movies.value[0]);
const otherMovies = computed(() => movies.value.slice(1, 5));
const movieCount = computed(() => topMovies.value.totalMovies);
const year = computed(() => props.rewind.rewind.year);

const backgroundImage = computed(() =>
  topMovies.value.background
    ? assetUrl(topMovies.value.background, year.value)
    : null,
);

const beat1Ref = ref<HTMLElement | null>(null);
const beat2Ref = ref<HTMLElement | null>(null);
const heroRef = ref<HTMLElement | null>(null);
const heroContentRef = ref<HTMLElement | null>(null);
const otherMoviesRef = ref<HTMLElement | null>(null);
const finalLabelRef = ref<HTMLElement | null>(null);
const backgroundComponentRef = ref<InstanceType<typeof SceneBackground> | null>(
  null,
);

const hasCompleted = ref(false);

let ctx: gsap.Context | null = null;
let timeline: gsap.core.Timeline | null = null;

function setFinalState() {
  gsap.set([beat1Ref.value, beat2Ref.value], { autoAlpha: 0 });

  const backgroundElement = backgroundComponentRef.value?.element;

  if (heroRef.value) {
    gsap.set(heroRef.value, {
      y: "-20vh",
      scale: 0.68,
    });
  }

  if (heroContentRef.value) {
    gsap.set(heroContentRef.value, {
      y: 0,
      scale: 1,
      opacity: 1,
    });
  }

  if (otherMoviesRef.value) {
    gsap.set(otherMoviesRef.value, {
      autoAlpha: 1,
      y: 0,
    });
  }

  if (finalLabelRef.value) {
    gsap.set(finalLabelRef.value, {
      autoAlpha: 1,
      y: 0,
    });
  }

  if (backgroundElement) {
    gsap.set(backgroundElement, {
      opacity: 0.5,
      scale: 1,
    });
  }
}

function playAnimation() {
  if (hasCompleted.value) {
    setFinalState();
    return;
  }

  if (!beat1Ref.value || !beat2Ref.value || !heroRef.value) return;

  const backgroundElement = backgroundComponentRef.value?.element;

  if (!backgroundElement) return;

  timeline?.kill();

  gsap.set([beat1Ref.value, beat2Ref.value], {
    autoAlpha: 0,
  });

  gsap.set(beat1Ref.value, {
    autoAlpha: 1,
  });

  gsap.set(heroRef.value, {
    y: 0,
    scale: 1,
  });

  gsap.set(heroContentRef.value, {
    y: 40,
    opacity: 0,
  });

  gsap.set(otherMoviesRef.value, {
    autoAlpha: 0,
    y: 50,
  });

  gsap.set(finalLabelRef.value, {
    autoAlpha: 0,
    y: 25,
  });

  timeline = gsap.timeline({
    defaults: {
      ease: "power3.out",
    },
    onComplete: () => {
      hasCompleted.value = true;
    },
  });

  timeline
    .fromTo(
      beat1Ref.value,
      { autoAlpha: 0, y: 45 },
      { autoAlpha: 1, y: 0, duration: 1.15 },
    )
    .to({}, { duration: 2 })
    .to(beat1Ref.value, {
      autoAlpha: 0,
      y: -30,
      duration: 0.8,
      ease: "power2.inOut",
    })
    .fromTo(
      beat2Ref.value,
      { autoAlpha: 0, y: 35 },
      { autoAlpha: 1, y: 0, duration: 1 },
      "<0.25",
    )
    .to({}, { duration: 1.8 })
    .to(beat2Ref.value, {
      autoAlpha: 0,
      y: -30,
      duration: 0.8,
      ease: "power2.inOut",
    })
    .to(
      heroRef.value,
      {
        autoAlpha: 1,
        duration: 0.01,
      },
      "<",
    )
    .to(
      backgroundElement,
      {
        opacity: 0.5,
        scale: 1,
        duration: 1.5,
        ease: "power2.out",
      },
      "<",
    )
    .fromTo(
      heroContentRef.value,
      { y: 40, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2 },
      "<",
    )
    .to({}, { duration: 2.8 })
    .to(heroRef.value, {
      y: "-20vh",
      scale: 0.68,
      duration: 1.15,
      ease: "power3.inOut",
    })
    .fromTo(
      finalLabelRef.value,
      { autoAlpha: 0, y: 25 },
      { autoAlpha: 1, y: 0, duration: 0.7 },
      "-=0.65",
    )
    .fromTo(
      otherMoviesRef.value,
      { autoAlpha: 0, y: 45 },
      { autoAlpha: 1, y: 0, duration: 0.95 },
      "-=0.45",
    );
}

function resetAnimation() {
  hasCompleted.value = false;
  timeline?.kill();
  timeline = null;

  if (!beat1Ref.value) return;

  const backgroundElement = backgroundComponentRef.value?.element;

  if (!backgroundElement) return;

  gsap.set(
    [
      beat1Ref.value,
      beat2Ref.value,
      heroRef.value,
      otherMoviesRef.value,
      finalLabelRef.value,
    ],
    { autoAlpha: 0 },
  );

  gsap.set(heroRef.value, {
    y: 0,
    scale: 1,
  });

  gsap.set(heroContentRef.value, {
    y: 40,
    scale: 1,
    opacity: 0,
  });

  gsap.set(backgroundElement, {
    opacity: 0,
    scale: 1.08,
  });
}

function setInitialState() {
  const backgroundElement = backgroundComponentRef.value?.element;

  if (!backgroundElement) return;

  gsap.set([beat1Ref.value, beat2Ref.value], {
    autoAlpha: 0,
  });

  gsap.set(heroRef.value, {
    y: 0,
    scale: 1,
  });

  gsap.set(heroContentRef.value, {
    y: 40,
    scale: 1,
    opacity: 0,
  });

  gsap.set(otherMoviesRef.value, {
    autoAlpha: 0,
    y: 50,
  });

  gsap.set(finalLabelRef.value, {
    autoAlpha: 0,
    y: 25,
  });

  gsap.set(backgroundElement, {
    opacity: 0,
    scale: 1.08,
  });
}

defineExpose({
  resetAnimation,
});

const sceneIndex = computed(() =>
  Object.keys(props.rewind.scenes).indexOf("top-movies"),
);

const isActive = computed(
  () => props.sceneMeta.currentSceneIndex.value === sceneIndex.value,
);

const stopWatchingActive = watch(
  isActive,
  (active) => {
    if (active) {
      nextTick(playAnimation);
    } else if (!hasCompleted.value) {
      resetAnimation();
    }
  },
  { immediate: true },
);

onMounted(() => {
  ctx = gsap.context(() => {
    setInitialState();
  });
});

onUnmounted(() => {
  stopWatchingActive();
  timeline?.kill();
  ctx?.revert();
});
</script>

<template>
  <section
    class="relative h-full min-h-screen w-full overflow-hidden bg-cinematic"
  >
    <SceneBackground
      v-if="backgroundImage"
      ref="backgroundComponentRef"
      :image="backgroundImage"
    />

    <div
      ref="beat1Ref"
      class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
    >
      <div class="max-w-4xl">
        <p
          class="mb-8 text-sm font-display font-bold uppercase tracking-[0.3em] text-text-secondary md:text-base"
        >
          Let's start with the movies
        </p>

        <div class="flex flex-col items-center">
          <span
            class="text-xl font-display font-medium uppercase tracking-[0.18em] text-white/70 md:text-2xl"
          >
            You watched
          </span>

          <AnimatedNumber
            :value="movieCount"
            :duration="1200"
            class="mt-2 text-8xl font-display font-black leading-none text-gradient sm:text-9xl md:text-[10rem]"
          />

          <span
            class="mt-3 text-2xl font-display font-bold text-white md:text-4xl"
          >
            movies this year.
          </span>
        </div>
      </div>
    </div>

    <div
      ref="beat2Ref"
      class="absolute inset-0 z-10 flex items-center justify-center px-6 text-center"
    >
      <div class="max-w-5xl">
        <p
          class="text-sm font-display font-bold uppercase tracking-[0.3em] text-text-secondary md:text-base"
        >
          And you had some favorites
        </p>

        <h2
          class="mt-6 text-5xl font-display font-black leading-[0.9] tracking-tight text-gradient sm:text-6xl md:text-8xl lg:text-9xl"
        >
          THE MOVIES<br />
          YOU LOVED MOST
        </h2>
      </div>
    </div>

    <div
      ref="heroRef"
      class="absolute inset-0 z-10 flex items-center justify-center px-6 py-20"
    >
      <div
        v-if="topMovie"
        ref="heroContentRef"
        class="flex w-full max-w-6xl flex-col items-center justify-center gap-10 text-center md:flex-row md:gap-20 md:text-left"
      >
        <div class="relative shrink-0">
          <div
            class="absolute -inset-8 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgb(from_var(--color-primary)_r_g_b_/_25%),transparent_70%)] blur-2xl"
          />

          <div class="relative">
            <PosterReveal
              v-if="topMovie.thumb"
              :poster="assetUrl(topMovie.thumb, year) ?? undefined"
              :title="topMovie.title"
              size="lg"
            />
          </div>
        </div>

        <div class="max-w-2xl">
          <p
            class="text-xl font-display font-black uppercase tracking-[0.25em] text-primary md:text-3xl"
          >
            Your #1 movie
          </p>

          <h1
            class="mt-5 text-5xl font-display font-black leading-[0.88] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl"
          >
            {{ topMovie.title }}
          </h1>

          <div
            class="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-text-secondary md:justify-start md:text-base"
          >
            <span v-if="topMovie.year">{{ topMovie.year }}</span>
            <span class="text-white/20">·</span>
            <span>
              {{ topMovie.plays }}
              {{ topMovie.plays === 1 ? "view" : "views" }}
            </span>
          </div>

          <p
            class="mt-8 max-w-lg text-lg leading-relaxed text-white/60 md:text-xl"
          >
            Out of everything you watched, this one came out on top.
          </p>
        </div>
      </div>
    </div>

    <div
      ref="finalLabelRef"
      class="absolute inset-x-0 top-[8vh] z-20 text-center"
    ></div>

    <div ref="otherMoviesRef" class="absolute inset-x-0 bottom-[7vh] z-20 px-6">
      <div class="mx-auto w-full max-w-4xl">
        <StaggerReveal :delay="100" :duration="650">
          <div class="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div
              v-for="movie in otherMovies"
              :key="movie.ratingKey ?? movie.rank"
              class="group min-w-0"
            >
              <div
                class="relative mx-auto aspect-[2/3] w-full max-w-[150px] overflow-hidden rounded-lg bg-surface shadow-2xl ring-1 ring-white/10"
              >
                <img
                  v-if="movie.thumb"
                  :src="assetUrl(movie.thumb, year) ?? undefined"
                  :alt="movie.title"
                  class="h-full w-full object-cover"
                  loading="eager"
                />

                <div
                  v-else
                  class="grid h-full w-full place-items-center p-3 text-center text-xs text-text-secondary"
                >
                  {{ movie.title }}
                </div>

                <div
                  class="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/65 text-xs font-display font-black text-white backdrop-blur-md ring-1 ring-white/15"
                >
                  {{ movie.rank }}
                </div>
              </div>

              <div class="mx-auto mt-2 max-w-[150px] text-center">
                <h3
                  class="truncate text-sm font-display font-bold text-white"
                  :title="movie.title"
                >
                  {{ movie.title }}
                </h3>

                <p class="mt-1 text-[11px] text-text-tertiary">
                  {{ movie.plays }}
                  {{ movie.plays === 1 ? "play" : "plays" }}
                </p>
              </div>
            </div>
          </div>
        </StaggerReveal>
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-32 bg-gradient-to-t from-background to-transparent"
    />
  </section>
</template>
