<script setup lang="ts">
import { ref, onMounted } from "vue";
import { RouterView } from "vue-router";
import { useAuth } from "./services/auth";

const { checkAuthentication } = useAuth();

const loading = ref(true);
const error = ref(false);

async function initializeAuthentication() {
  loading.value = true;
  error.value = false;

  try {
    await checkAuthentication();
  } catch (err) {
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(initializeAuthentication);
</script>

<template>
  <div class="min-h-screen bg-background text-text">
    <main v-if="loading" class="flex min-h-screen items-center justify-center">
      <div class="text-center">
        <div
          class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-primary"
        />
      </div>
    </main>

    <main
      v-else-if="error"
      class="flex min-h-screen items-center justify-center px-6"
    >
      <div class="text-center">
        <h1 class="text-xl font-semibold">Something went wrong</h1>

        <button
          type="button"
          class="mt-6 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
          @click="initializeAuthentication"
        >
          Retry
        </button>
      </div>
    </main>

    <RouterView v-else />
  </div>
</template>
