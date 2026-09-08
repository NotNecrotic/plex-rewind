<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { RewindData } from "@/types";
import { type AuthUser } from "../../services/api";
import { gsap } from "gsap";
import SplitText from "../animation/SplitText.vue";

const props = defineProps<{
  snapshot: RewindData;
  scene: Record<string, any>;
  user: AuthUser;
}>();

const snapshot = props.snapshot;
const user = props.user;

const username = computed(() => user.username);
//const avatar = computed(() => artworkUrl(user.thumb));
const year = computed(() => snapshot.rewind?.year ?? new Date().getFullYear());

const contentRef = ref<HTMLElement | null>(null);
const gridRef = ref<HTMLElement | null>(null);

const placeholderPosters = [
  "https://picsum.photos/seed/movie01/500/750",
  "https://picsum.photos/seed/movie02/500/750",
  "https://picsum.photos/seed/movie03/500/750",
  "https://picsum.photos/seed/movie04/500/750",
  "https://picsum.photos/seed/movie05/500/750",
  "https://picsum.photos/seed/movie06/500/750",
  "https://picsum.photos/seed/movie07/500/750",
  "https://picsum.photos/seed/movie08/500/750",
  "https://picsum.photos/seed/movie09/500/750",
  "https://picsum.photos/seed/movie10/500/750",
  "https://picsum.photos/seed/movie11/500/750",
  "https://picsum.photos/seed/movie12/500/750",
  "https://picsum.photos/seed/movie13/500/750",
  "https://picsum.photos/seed/movie14/500/750",
  "https://picsum.photos/seed/movie15/500/750",
  "https://picsum.photos/seed/movie16/500/750",
  "https://picsum.photos/seed/movie17/500/750",
  "https://picsum.photos/seed/movie18/500/750",
  "https://picsum.photos/seed/movie19/500/750",
  "https://picsum.photos/seed/movie20/500/750",
  "https://picsum.photos/seed/movie21/500/750",
  "https://picsum.photos/seed/movie22/500/750",
  "https://picsum.photos/seed/movie23/500/750",
  "https://picsum.photos/seed/movie24/500/750",
];

const rows = computed(() => {
  const result: string[][] = [];

  for (let i = 0; i < 4; i++) {
    const start = (i * 6) % placeholderPosters.length;

    const row = Array.from({ length: 8 }, (_, index) => {
      return placeholderPosters[(start + index) % placeholderPosters.length];
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

    const tiles = gridRef.value.querySelectorAll(".movie-tile");

    gsap.set(tiles, {
      opacity: 0,
      scale: 1.08,
      filter: "blur(10px)",
    });

    gsap.to(tiles, {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      duration: 1.15,
      stagger: {
        each: 0.025,
        from: "random",
      },
      ease: "power3.out",
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
          class="movie-tile relative aspect-[2/3] w-[clamp(120px,14vw,240px)] flex-none overflow-hidden rounded-lg"
        >
          <img
            :src="poster"
            alt=""
            class="h-full w-full object-cover"
            loading="eager"
          />
        </div>

        <div
          v-for="(poster, index) in row"
          :key="`b-${rowIndex}-${index}`"
          class="movie-tile relative aspect-[2/3] w-[clamp(120px,14vw,240px)] flex-none overflow-hidden rounded-lg"
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
      class="pointer-events-none absolute inset-0 z-[3] bg-[rgb(from_var(--color-primary)_r_g_b_/_45%)]"
    />

    <div class="pointer-events-none absolute inset-0 z-[4] bg-black/55" />

    <div
      class="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_center,transparent_15%,rgb(0_0_0_/_35%)_65%,rgb(0_0_0_/_75%)_100%)]"
    />

    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 z-[6] h-1/2 bg-gradient-to-t from-background via-background/40 to-transparent"
    />

    <div
      ref="contentRef"
      class="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
    >
      <div class="flex items-center gap-4">
        <!--<div
          v-if="avatar"
          class="h-18 w-18 overflow-hidden rounded-full ring-2 ring-white/15"
        >
          <img :src="avatar" alt="profile" class="h-full w-full object-cover" />
        </div>

        <div
          v-else
          class="grid h-18 w-18 place-items-center rounded-full bg-surface text-lg font-bold text-white/70"
        >
          {{ username.charAt(0).toUpperCase() }}
        </div>-->

        <span class="text-5xl font-black text-primary md:text-7xl">
          {{ username }}'s
        </span>
      </div>

      <div class="mt-8">
        <SplitText
          :text="`PLEX REWIND ${year}`"
          tag="h1"
          :stagger="0.045"
          :duration="1100"
          :y-offset="35"
          class="text-3xl font-black leading-[0.9] tracking-[0.085em] text-white sm:text-3xl md:text-4xl lg:text-[6rem]"
        />
      </div>

      <div class="mx-auto mt-9 max-w-3xl">
        <p class="mt-4 text-xl text-white/80 md:text-2xl">
          Here's a look at everything you watched, discovered, and loved on
          Plex.
        </p>
      </div>

      <div class="mt-14">
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
