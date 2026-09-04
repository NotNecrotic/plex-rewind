<script setup lang="ts">
import { Play, ArrowRight } from "@lucide/vue";
import { useRouter } from "vue-router";

const router = useRouter();

async function signInWithPlex() {
  router.push("/auth");
}
</script>

<template>
  <main class="relative min-h-screen overflow-hidden bg-[#05050a] text-white">
    <div class="absolute inset-[-12%] z-0">
      <div class="absolute inset-0 landing-image z-0" />
      <div class="absolute inset-0 landing-vignette z-20" />
    </div>

    <div class="pointer-events-none absolute inset-0 grain" />

    <section
      class="relative z-10 flex h-screen flex-col items-center justify-center gap-4 text-center"
    >
      <div class="flex flex-col gap-4 px-4 text-center">
        <div class="text-4xl font-bold">PLEX REWIND</div>
        <h1 class="text-6xl font-bold">
          <span class="block">YOUR YEAR</span>
          <span class="block">REPLAYED</span>
        </h1>
      </div>
      <div class="flex flex-col items-center gap-4">
        <button
          type="button"
          @click="signInWithPlex"
          class="group inline-flex cursor-pointer items-center gap-3 rounded-full border border-[#e5a00d]/40 bg-[#e5a00d] px-5 py-3.5 text-[0.85rem] font-bold text-[#080808] transition-all duration-300 hover:-translate-y-0.5"
        >
          <span class="grid size-7 place-items-center rounded-full bg-black/15">
            <Play :size="16" :stroke-width="2.5" />
          </span>
          <span>Sign in with Plex</span>

          <ArrowRight
            class="transition-transform duration-250 group-hover:translate-x-1"
            :size="17"
            :stroke-width="2"
          />
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing-image {
  background-image: url("https://wallpaper.dog/large/5543674.jpg");
  background-size: cover;
  background-position: center;

  filter: saturate(0.8) contrast(1.08) brightness(0.48);

  transform: scale(1.08) rotate(-8deg);
}

.landing-vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 35%,
    rgba(3, 3, 7, 0.45) 72%,
    rgba(3, 3, 7, 0.9) 100%
  );
}

@media (max-width: 768px) {
  .landing-image {
    background-position: 55% center;
  }
}
</style>
