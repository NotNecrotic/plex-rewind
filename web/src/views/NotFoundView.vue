<script setup lang="ts">
import { ArrowLeft, Home } from "@lucide/vue";
import { useRouter } from "vue-router";

const router = useRouter();

function goBack() {
  router.back();
}

function goHome() {
  router.push("/");
}
</script>

<template>
  <main
    class="flex min-h-screen items-center justify-center bg-[#05050a] px-6 text-white"
  >
    <div class="text-center">
      <h1 class="mt-5 text-8xl font-black tracking-[-0.06em] sm:text-9xl">
        404
      </h1>

      <h2 class="mt-2 text-2xl font-bold">This page doesn't exist.</h2>

      <p class="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/45">
        The page you're looking for couldn't be found. It may have been moved,
        deleted, or never existed.
      </p>

      <div class="mt-8 flex items-center justify-center gap-3">
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          @click="goBack"
        >
          <ArrowLeft :size="16" />
          Go back
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-black transition"
          @click="goHome"
        >
          <Home :size="16" />
          Home
        </button>
      </div>
    </div>
  </main>
</template>
