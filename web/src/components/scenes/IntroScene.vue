<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { RewindData } from "@/types";
import { assetUrl, type AuthUser } from "../../services/api";
import { gsap } from "gsap";

const props = defineProps<{
  rewind: RewindData;
  sceneMeta: Record<string, any>;
  user: AuthUser;
}>();

const rewind = props.rewind;
const user = props.user;

const username = computed(() => user.username);
const year = computed(() => rewind.rewind?.year ?? new Date().getFullYear());

const contentRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);

const thumbnails = computed<string[]>(() => {
  const intro = props.rewind.scenes["intro"] as {
    thumbnails: string;
  };

  return Array.isArray(intro.thumbnails)
    ? intro.thumbnails.filter(
        (thumbnail): thumbnail is string =>
          typeof thumbnail === "string" &&
          thumbnail.length > 0 &&
          !thumbnail.startsWith("/"), // TODO: make builder repalce reletave paths (failed asset caches) with empty strings.
      )
    : [];
});

const artwork = computed(() => {
  return thumbnails.value.map((thumbnail) =>
    assetUrl(thumbnail, rewind.rewind.year),
  );
});

const rows = computed(() => {
  if (artwork.value.length === 0) {
    return [];
  }

  const result: string[][] = [];

  for (let i = 0; i < 4; i++) {
    const start = (i * 6) % artwork.value.length;

    const row = Array.from({ length: 8 }, (_, index) => {
      return artwork.value[(start + index) % artwork.value.length];
    });

    result.push(row);
  }

  return result;
});

onMounted(() => {
  const ctx = gsap.context(() => {
    if (!gridRef.value) return;

    const rowElements =
      gridRef.value.querySelectorAll<HTMLElement>(".movie-row");

    rowElements.forEach((row, index) => {
      const direction = index % 2 === 0 ? -1 : 1;

      const distance = row.scrollWidth / 2;

      gsap.fromTo(
        row,
        {
          x: direction === -1 ? 0 : -distance,
        },
        {
          x: direction === -1 ? -distance : 0,
          duration: 35 + index * 5,
          repeat: -1,
          ease: "none",
        },
      );
    });

    if (contentRef.value) {
      gsap.fromTo(
        contentRef.value,
        {
          y: 25,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          delay: 0.45,
          ease: "power3.out",
        },
      );
    }
  });

  onUnmounted(() => {
    ctx.revert();
  });
});
</script>

<template>
  <section
    class="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background"
  >
    <div
      ref="gridRef"
      class="pointer-events-none absolute inset-[-12%] flex flex-col justify-center gap-3 overflow-hidden"
    >
      <div
        v-for="(row, rowIndex) in rows"
        :key="rowIndex"
        class="movie-row flex w-max gap-3"
      >
        <div
          v-for="(poster, index) in row"
          :key="`a-${rowIndex}-${index}`"
          class="movie-tile relative aspect-2/3 w-[clamp(140px,14vw,240px)] flex-none overflow-hidden rounded-lg"
        >
          <img
            :src="poster"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div
          v-for="(poster, index) in row"
          :key="`b-${rowIndex}-${index}`"
          class="movie-tile relative aspect-2/3 w-[clamp(140px,14vw,240px)] flex-none overflow-hidden rounded-lg"
        >
          <img
            :src="poster"
            alt=""
            class="h-full w-full object-cover"
            loading="eager"
          />
        </div>
      </div>
    </div>

    <div
      class="pointer-events-none absolute inset-0 z-3 bg-[rgb(from_var(--color-primary)_r_g_b/45%)]"
    />

    <div class="pointer-events-none absolute inset-0 z-4 bg-black/55" />

    <div
      class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_10%,rgb(0_0_0/30%)_55%,rgb(0_0_0/80%)_100%)]"
    />

    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-6 h-1/2 bg-linear-to-t from-background via-background/40 to-transparent"
    />

    <div
      ref="contentRef"
      class="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
    >
      <div class="flex items-center gap-4">
        <span
          class="max-w-[90vw] text-4xl font-black leading-tight text-primary sm:text-5xl md:text-7xl"
        >
          {{ username }}'s
        </span>
      </div>

      <div class="mt-5 sm:mt-8">
        <h1
          class="text-5xl font-black leading-[0.9] tracking-[0.04em] text-white sm:text-3xl md:text-4xl lg:text-[6rem]"
        >
          PLEX REWIND {{ year }}
        </h1>
      </div>

      <div class="mx-auto mt-6 max-w-3xl sm:mt-9">
        <p
          class="mt-4 max-w-[90vw] text-base leading-relaxed text-white/80 sm:text-xl md:text-2xl"
        >
          Here's a look at everything you discovered, watched, and loved on Plex
          this year.
        </p>
      </div>

      <div class="mt-10 sm:mt-14">
        <div
          class="mx-auto flex w-fit animate-bounce flex-col items-center gap-2 text-white/40"
        >
          <span class="text-[11px] font-base uppercase tracking-[0.2em]">
            Scroll to explore
          </span>

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  </section>
</template>
