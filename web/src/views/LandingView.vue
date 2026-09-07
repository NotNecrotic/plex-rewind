<script setup lang="ts">
import QuickLink from "../components/QuickLink.vue";
import { BookOpen } from "@lucide/vue";
import GithubIcon from "../components/icons/GithubIcon.vue";
import DiscordIcon from "../components/icons/DiscordIcon.vue";
import { useRouter } from "vue-router";
import PrimaryButton from "../components/PrimaryButton.vue";

const router = useRouter();

function signInWithPlex() {
  router.push("/auth");
}
</script>

<template>
  <main class="relative flex min-h-screen overflow-hidden text-white">
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="landing-image absolute inset-[-14%]" />
      <div class="landing-glow absolute inset-0" />
      <div class="landing-vignette absolute inset-0" />
      <div class="landing-bottom-fade absolute inset-0" />
    </div>

    <div class="pointer-events-none absolute inset-0 grain" />

    <section
      class="relative z-10 flex min-h-screen w-full flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div class="flex w-full max-w-3xl flex-col items-center">
        <div class="landing-logo mb-8 flex justify-center">
          <img
            src="../assets/rewindarr.png"
            class="block h-auto w-[38vw] object-contain"
          />
        </div>

        <p
          class="max-w-xl text-sm font-medium leading-6 text-text/60 sm:text-[1.1rem] sm:leading-7"
        >
          lorem ipsum dolor sit amet consectetur adipiscing elit amet anim magna
          blanditiis repellendus libero est excepturi sint dolor dignissimos
        </p>

        <div class="mt-8">
          <PrimaryButton text="Sign in with Plex" @click="signInWithPlex" />
        </div>

        <nav class="mt-9 flex items-center justify-center gap-3">
          <QuickLink href="#" label="GitHub" :icon="GithubIcon" />
          <QuickLink href="#" label="Discord" :icon="DiscordIcon" />
          <QuickLink href="#" label="Docs" :icon="BookOpen" />
        </nav>
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing-image {
  background-image: url("../assets/landing.jpg");
  background-size: cover;
  background-position: center;

  filter: saturate(0.75) contrast(1.1) brightness(0.42);

  transform: rotate(-8deg) scale(1.1);
}

.landing-glow {
  background:
    radial-gradient(
      ellipse 42% 50% at 18% 50%,
      rgb(from var(--color-primary) r g b / 42%),
      transparent 70%
    ),
    radial-gradient(
      ellipse 42% 50% at 82% 50%,
      rgb(from var(--color-secondary) r g b / 38%),
      transparent 70%
    );
}

.landing-vignette {
  background:
    linear-gradient(
      to bottom,
      rgb(from var(--color-background) r g b / 40%) 0%,
      transparent 25%,
      transparent 65%,
      rgb(from var(--color-background) r g b / 78%) 100%
    ),
    radial-gradient(
      ellipse at center,
      transparent 18%,
      rgb(from var(--color-background) r g b / 30%) 55%,
      rgb(from var(--color-background) r g b / 88%) 100%
    );
}

.landing-bottom-fade {
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgb(from var(--color-background) r g b / 45%) 80%,
    var(--color-background) 100%
  );
}

.landing-logo {
  filter: drop-shadow(0 16px 35px rgb(from var(--color-background) r g b / 90%))
    drop-shadow(0 0 20px rgb(from var(--color-background) r g b / 80%))
    drop-shadow(0 0 45px rgb(from var(--color-background) r g b / 60%));
}

@media (max-width: 768px) {
  .landing-image {
    background-position: 55% center;
  }
}
</style>
