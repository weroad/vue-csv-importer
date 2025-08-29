<template>
  <div class="csvi-error-nav" role="group" aria-label="Error navigation">
    <button
      class="csvi-error-nav-btn"
      :disabled="isDisabled || total === 0"
      aria-label="Previous error"
      @click="$emit('prev')"
    >
      ‹
    </button>
    <div class="csvi-error-nav-label">
      <slot>
        {{ label }}
      </slot>
    </div>
    <button
      class="csvi-error-nav-btn"
      :disabled="isDisabled || total === 0"
      aria-label="Next error"
      @click="$emit('next')"
    >
      ›
    </button>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    label: string;
    total: number;
    isDisabled?: boolean;
  }>(),
  {
    isDisabled: false,
  },
);

defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
}>();
</script>

<style lang="postcss" scoped>
.csvi-error-nav {
  @apply w-full md:w-auto inline-flex items-center justify-between gap-1.5 md:gap-3 text-slate-600 bg-red-50 border border-red-200 rounded-md md:rounded-lg px-2 py-2 md:px-3 md:py-2 text-sm;
}
.csvi-error-nav-btn {
  @apply w-6 h-6 md:w-6 md:h-6 inline-flex items-center justify-center bg-red-100 text-red-500 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-50 text-base md:text-lg;
}
.csvi-error-nav-label {
  @apply text-xs md:text-sm font-semibold text-red-700;
}
</style>
