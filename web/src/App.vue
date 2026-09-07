<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterView } from "vue-router";
import { useAuth } from "./services/auth";

const { checkAuthentication } = useAuth();

const error = ref(false);

async function initializeAuthentication() {
  error.value = false;

  try {
    await checkAuthentication();
  } catch (err) {
    error.value = true;
  } finally {
  }
}

onMounted(initializeAuthentication);
</script>

<template>
  <div class="min-h-screen bg-background text-text">
    <RouterView />

    <main
      v-if="error"
      class="flex min-h-screen items-center justify-center px-6"
    >
      <div class="text-center">
        <h1 class="text-xl font-semibold">Something went wrong</h1>

        <button
          type="button"
          class="mt-6 gap-2 rounded-xl bg-white cursor-pointer px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.99]"
          @click="initializeAuthentication"
        >
          Retry
        </button>
      </div>
    </main>
  </div>
</template>
