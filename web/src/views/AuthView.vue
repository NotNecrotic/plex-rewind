<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { ExternalLink, LoaderCircle, Check, Copy } from "@lucide/vue";
import { api } from "../services/api";
import { useAuth } from "../services/auth";

const { checkAuthentication: checkSession } = useAuth();

import { useRouter } from "vue-router";

const router = useRouter();

const code = ref<string | null>(null);
const pinId = ref<number | null>(null);

const status = ref<"starting" | "waiting" | "linked" | "error">("starting");

const errorMessage = ref("");
const copied = ref(false);

let pollTimer: number | null = null;
let copyResetTimer: number | null = null;

async function startAuthentication() {
  status.value = "starting";
  errorMessage.value = "";

  try {
    const result = await api.startPlexAuth();

    code.value = result.code;
    pinId.value = result.id;

    status.value = "waiting";

    startPolling();
  } catch (error) {
    console.error("Failed to start Plex authentication:", error);

    status.value = "error";
    errorMessage.value = "Unable to connect to Plex. Please try again.";
  }
}

function startPolling() {
  stopPolling();

  pollTimer = window.setInterval(checkAuthentication, 3000);

  checkAuthentication();
}

async function checkAuthentication() {
  if (pinId.value === null) {
    return;
  }

  try {
    const result = await api.checkPlexAuth(pinId.value);

    if (result === "linked") {
      status.value = "linked";
      stopPolling();
      await checkSession();
      router.push("/dashboard");
    }

    if (result === "expired") {
      status.value = "error";
      errorMessage.value =
        "This authorization code has expired. Please try again.";

      stopPolling();
    }
  } catch (error) {
    console.error("Failed to check Plex authentication:", error);
  }
}

async function copyCode() {
  if (!code.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(code.value);

    copied.value = true;

    if (copyResetTimer !== null) {
      window.clearTimeout(copyResetTimer);
    }

    copyResetTimer = window.setTimeout(() => {
      copied.value = false;
      copyResetTimer = null;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy Plex authorization code:", error);
  }
}

function stopPolling() {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer);
    pollTimer = null;
  }
}

function openPlex() {
  window.open("https://plex.tv/link", "_blank", "noopener,noreferrer");
}

onMounted(() => {
  startAuthentication();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-6 py-16">
    <div class="w-full max-w-xl">
      <header class="mb-10 text-center">
        <img
          src="../assets/rewindarr.png"
          alt="Rewindarr"
          class="mx-auto h-12 w-auto md:h-14"
        />
      </header>

      <section
        class="rounded-3xl border border-2 border-border bg-surface p-8 shadow-2xl backdrop-blur-xl md:p-10"
      >
        <div class="text-center">
          <h2 class="text-xl font-semibold text-text">
            Link your Plex account
          </h2>

          <p class="mt-2 text-sm text-text/50">
            Use the code below to connect your Plex account.
          </p>
        </div>

        <div
          class="mt-8 rounded-2xl border border-2 border-border bg-surface-elevated p-8 text-center"
        >
          <p class="text-sm text-text/50">Your authorization code</p>

          <div
            v-if="status === 'starting'"
            class="mt-5 flex flex-col items-center gap-3"
          >
            <LoaderCircle class="h-8 w-8 animate-spin text-text/60" />

            <span class="text-sm text-text/40">
              Generating authorization code...
            </span>
          </div>

          <div
            v-else-if="code"
            class="mt-4 flex items-center justify-center gap-3"
          >
            <div
              class="text-5xl font-bold tracking-[0.25em] text-text md:text-6xl"
            >
              {{ code }}
            </div>

            <button
              type="button"
              :aria-label="copied ? 'Code copied' : 'Copy code'"
              :title="copied ? 'Copied!' : 'Copy code'"
              class="grid h-10 w-10 flex-none cursor-pointer place-items-center rounded-lg border border-2 border-border bg-surface text-text/55 transition-all duration-200 hover:border-primary/30 hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              @click="copyCode"
            >
              <Check v-if="copied" class="h-4 w-4 text-primary" />

              <Copy v-else class="h-4 w-4" />
            </button>
          </div>

          <div v-else-if="status === 'error'" class="mt-5 text-sm text-red-400">
            Unable to generate an authorization code.
          </div>
        </div>
        <div
          v-if="status === 'waiting'"
          class="mt-6 flex items-center justify-center gap-3"
        >
          <LoaderCircle class="h-5 w-5 animate-spin text-text/50" />

          <span class="text-sm text-text/60">
            Waiting for authorization...
          </span>
        </div>

        <div
          v-else-if="status === 'linked'"
          class="mt-6 flex items-center justify-center gap-3"
        >
          <Check class="h-5 w-5 text-green-400" />

          <span class="text-sm text-green-400"> Plex account linked! </span>
        </div>

        <div
          v-else-if="status === 'error'"
          class="mt-6 text-center text-sm text-red-400"
        >
          {{ errorMessage }}
        </div>

        <button
          v-if="code && status === 'waiting'"
          type="button"
          class="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white cursor-pointer px-6 py-4 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.99]"
          @click="openPlex"
        >
          Link with Plex

          <ExternalLink class="h-4 w-4" />
        </button>

        <button
          v-if="status === 'error'"
          type="button"
          class="mt-8 w-full rounded-xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-white/90 active:scale-[0.99]"
          @click="startAuthentication"
        >
          Try again
        </button>

        <div
          v-if="status !== 'starting'"
          class="mt-10 border-t border-white/10 pt-8"
        >
          <h3 class="text-sm font-semibold text-text">How to connect</h3>

          <ol class="mt-5 space-y-4 text-sm text-text/60">
            <li class="flex gap-4">
              <span
                class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-xs text-text"
              >
                1
              </span>

              <span>
                Click
                <strong class="font-medium text-text"> Link with Plex </strong>.
              </span>
            </li>

            <li class="flex gap-4">
              <span
                class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-xs text-text"
              >
                2
              </span>

              <span> Enter the authorization code shown above. </span>
            </li>

            <li class="flex gap-4">
              <span
                class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/10 text-xs text-text"
              >
                3
              </span>

              <span>
                Return here. We'll automatically detect when your Plex account
                has been connected.
              </span>
            </li>
          </ol>
        </div>
      </section>
    </div>
  </main>
</template>
