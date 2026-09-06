<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  ArrowRight,
  ChevronDown,
  LogOut,
  Play,
  LoaderCircle,
  Server,
  User,
} from "@lucide/vue";
import { api, type AuthUser } from "../services/api";
import { useRouter } from "vue-router";
import type { RewindDescriptor } from "../types";

const router = useRouter();

const loading = ref(true);
const authenticated = ref(false);
const user = ref<AuthUser | null>(null);
const rewinds = ref<RewindDescriptor[]>([]);
const serverName = ref<string | null>(null);
const error = ref("");
const profileMenuOpen = ref(false);

const latest = computed(() => rewinds.value[0] ?? null);

async function loadHome() {
  loading.value = true;
  error.value = "";

  try {
    const auth = await api.checkAuth();
    authenticated.value = auth.authenticated;
    user.value = auth.user ?? null;

    if (!authenticated.value) return;

    rewinds.value = await api.getMyRewinds();
    serverName.value = await api.getServerName();
  } catch (err) {
    console.error("Failed to load home:", err);
    error.value =
      err instanceof Error ? err.message : "Unable to load your Plex Rewind.";
  } finally {
    loading.value = false;
  }
}

function openRewind(id: string) {
  router.push(`/rewind/${encodeURIComponent(id)}`);
}

function signIn() {
  router.push("/auth");
}

async function signOut() {
  profileMenuOpen.value = false;

  try {
    await api.signOut();
  } catch (err) {
    console.error("Sign out failed:", err);
  }

  // Full reload so every piece of cached UI state resets.
  window.location.href = "/";
}

onMounted(loadHome);
</script>

<template>
  <main class="min-h-screen bg-background text-white">
    <div>
      <header class="bg-background backdrop-blur-xl">
        <div
          class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10"
        >
          <div class="flex items-center gap-4">
            <img
              src="../assets/rewindarr.png"
              alt="rewindarr"
              class="h-10 w-auto object-contain"
            />
          </div>

          <div class="relative">
            <button
              type="button"
              class="flex items-center gap-3 rounded-xl border-2 border-white/10 bg-white/[0.04] p-1.5 pr-3 transition hover:border-white/20 hover:bg-white/[0.07]"
              @click="profileMenuOpen = !profileMenuOpen"
            >
              <div
                class="size-9 overflow-hidden rounded-full border border-white/10 bg-white/[0.08]"
              >
                <img
                  v-if="user?.thumb"
                  :src="user.thumb"
                  :alt="user.username ?? 'Plex profile'"
                  class="h-full w-full object-cover"
                />

                <div
                  v-else
                  class="grid h-full w-full place-items-center text-white/40"
                >
                  <User :size="18" />
                </div>
              </div>

              <span
                class="hidden max-w-32 truncate text-sm font-medium text-white/70 sm:block"
              >
                {{ user?.username ?? "Plex user" }}
              </span>

              <ChevronDown
                :size="15"
                class="text-white/40 transition-transform"
                :class="{ 'rotate-180': profileMenuOpen }"
              />
            </button>

            <div
              v-if="profileMenuOpen"
              class="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 space-y-2 overflow-hidden rounded-2xl border-2 border-white/10 bg-surface p-2"
            >
              <div
                class="rounded-xl border border-white/[0.06] bg-surface-elevated p-4"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="size-11 flex-none overflow-hidden rounded-full border border-white/10 bg-white/[0.08]"
                  >
                    <img
                      v-if="user?.thumb"
                      :src="user.thumb"
                      :alt="user.username ?? 'Plex profile'"
                      class="h-full w-full object-cover"
                    />

                    <div
                      v-else
                      class="grid h-full w-full place-items-center text-white/40"
                    >
                      <User :size="20" />
                    </div>
                  </div>

                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-white">
                      {{ user?.username ?? "Plex user" }}
                    </p>

                    <p class="mt-0.5 truncate text-xs text-white/40">
                      {{ user?.email ?? "No email available" }}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-400/80 transition hover:bg-red-400/[0.08] hover:text-red-300"
                @click="signOut"
              >
                <LogOut :size="17" />

                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="mx-auto max-w-6xl px-6 py-14">
        <section>
          <h1 class="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">
            <span class="text-white/90">Welcome,</span>
            <span
              v-if="user?.username"
              class="ml-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            >
              {{ user.username }}
            </span>
            <span class="text-white/90">.</span>
          </h1>
        </section>
        <div class="mt-12 space-y-3">
          <p
            v-if="serverName"
            class="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-1.5 text-xs font-medium text-white/60"
          >
            <Server :size="14" class="text-primary/80" />
            <span>
              Rewinds from
              <span class="font-bold text-white/85">{{ serverName }}</span>
            </span>
          </p>
          <section v-if="latest">
            <p class="text-xs font-bold tracking-[0.25em] text-white/35">
              LATEST
            </p>
            2q
            <div
              class="mt-5 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-primary/25 bg-gradient-to-br from-white/[0.06] to-transparent p-8"
            >
              <div>
                <div class="text-6xl font-extrabold tracking-tight">
                  {{ latest.year }}
                </div>
                <p class="mt-3 text-white/55">{{ latest.title }}</p>
              </div>
              <button
                type="button"
                class="group inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-[#f0ad18]"
                @click="openRewind(latest.id)"
              >
                <Play :size="15" fill="currentColor" /> View my
                {{ latest.year }} Rewind
                <ArrowRight
                  :size="17"
                  class="transition-transform group-hover:translate-x-1"
                />
              </button>
            </div>
          </section>

          <section v-else>
            <div
              class="rounded-2xl border-2 border-white/10 bg-surface p-8 text-center"
            >
              <p class="text-sm text-white/50">Your rewind isn't ready yet.</p>
            </div>
          </section>

          <section v-if="rewinds.length">
            <p class="text-xs font-bold tracking-[0.25em] text-white/35">
              YOUR HISTORY
            </p>
            <h2 class="mt-2 text-2xl font-bold tracking-tight">
              Previous rewinds
            </h2>
            <div class="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                v-for="r in rewinds"
                :key="r.id"
                type="button"
                class="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-white/[0.055]"
                @click="openRewind(r.id)"
              >
                <div class="relative">
                  <span class="text-4xl font-extrabold tracking-tight">
                    {{ r.year }}
                  </span>
                  <p class="mt-3 text-sm text-white/45">{{ r.title }}</p>
                  <span
                    class="mt-4 block text-xs font-semibold uppercase tracking-[0.15em] text-primary/70"
                  >
                    View rewind
                  </span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  </main>
</template>
