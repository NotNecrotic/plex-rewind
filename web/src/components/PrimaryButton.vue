<script setup lang="ts">
import { ArrowRight } from "@lucide/vue";

withDefaults(
  defineProps<{
    text?: string;
    disabled?: boolean;
  }>(),
  {
    text: "Continue",
    disabled: false,
  },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="group inline-flex cursor-pointer items-center gap-3 rounded-xl bg-[linear-gradient(90deg,var(--color-secondary)_0%,var(--color-secondary)_35%,var(--color-primary)_65%,var(--color-primary)_100%)] bg-[length:300%_100%] bg-[position:100%_50%] px-6 py-4 text-sm font-bold text-[#080808] transition-all duration-600 hover:bg-[position:0%_50%] disabled:cursor-not-allowed disabled:opacity-50"
    @click="emit('click')"
  >
    <span>{{ text }}</span>

    <ArrowRight
      :size="16"
      :stroke-width="2"
      class="transition-transform duration-300 group-hover:translate-x-1"
    />
  </button>
</template>
