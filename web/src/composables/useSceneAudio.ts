import { ref, type Ref } from "vue";
interface SceneAudioOptions {
  delay?: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}
export function useSceneAudio(
  audioUrl: Ref<string | null>,
  options: SceneAudioOptions = {},
) {
  const { delay = 0, volume = 0.5, fadeIn = 0, fadeOut = 0 } = options;
  const audio = ref<HTMLAudioElement | null>(null);
  let fadeFrame: number | null = null;
  let delayTimeout: ReturnType<typeof setTimeout> | null = null;
  const fadeTo = (
    element: HTMLAudioElement,
    targetVolume: number,
    duration: number,
    onComplete?: () => void,
  ) => {
    if (fadeFrame !== null) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }

    if (duration <= 0) {
      element.volume = targetVolume;
      onComplete?.();
      return;
    }

    const startVolume = element.volume;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);

      element.volume = startVolume + (targetVolume - startVolume) * eased;

      if (progress < 1) {
        fadeFrame = requestAnimationFrame(tick);
      } else {
        fadeFrame = null;
        onComplete?.();
      }
    };

    fadeFrame = requestAnimationFrame(tick);
  };
  const play = () => {
    const start = () => {
      const url = audioUrl.value;
      if (!url) return;

      let element = audio.value;

      if (!element) {
        element = new Audio(url);
        element.preload = "auto";
        element.setAttribute("playsinline", "");
        element.volume = 0;

        audio.value = element;

        element.addEventListener("timeupdate", () => {
          if (
            element!.duration &&
            element!.currentTime >= element!.duration - fadeOut / 1000
          ) {
            fadeTo(element!, 0, fadeOut, () => {
              element!.pause();
              element!.currentTime = 0;

              if (audio.value === element) {
                audio.value = null;
              }
            });
          }
        });
      }

      element.currentTime = 0;
      element.muted = false;
      element.volume = 0;

      void element
        .play()
        .then(() => {
          fadeTo(element!, volume, fadeIn);
        })
        .catch((error) => {
          console.error("Failed to play scene audio:", error);
        });
    };

    stop();

    if (delay > 0) {
      delayTimeout = setTimeout(() => {
        delayTimeout = null;
        start();
      }, delay);
    } else {
      start();
    }
  };
  const stop = () => {
    if (delayTimeout !== null) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }

    const element = audio.value;
    if (!element) return;

    if (fadeFrame !== null) {
      cancelAnimationFrame(fadeFrame);
      fadeFrame = null;
    }

    element.muted = true;
    element.volume = 0;
  };

  const unlock = async () => {
    if (!audioUrl.value) return;
    if (audio.value) return;

    const element = new Audio(audioUrl.value);

    element.preload = "auto";
    element.setAttribute("playsinline", "");
    element.muted = true;
    element.volume = volume;

    audio.value = element;

    try {
      await element.play();
    } catch (error) {
      console.error("Failed to unlock audio:", error);
    }
  };
  return {
    play,
    stop,
    unlock,
  };
}
