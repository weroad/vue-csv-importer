import { ref, computed } from 'vue';
import type { CsvImporterProgressBar, CsvRow } from '../types';

export type ProgressBarDeps = {
  getUnprocessedRows: () => CsvRow[];
};

export const createProgressBar = (deps: ProgressBarDeps) => {
  const submitTotalRows = ref(0);
  const currentProgress = ref(0);
  const isProgressVisible = ref(false);
  const isProgressFinishing = ref(false);

  const progressPercent = computed(() => {
    if (submitTotalRows.value <= 0) {
      return 0;
    }

    const pct = Math.floor(
      (currentProgress.value / submitTotalRows.value) * 100,
    );
    return Math.max(0, Math.min(100, pct));
  });

  const controller: CsvImporterProgressBar = {
    start: () => {
      submitTotalRows.value = deps.getUnprocessedRows().length;
      currentProgress.value = 0;
      isProgressFinishing.value = false;
      isProgressVisible.value = true;
    },
    advance: (by = 1) => {
      const increment = Number.isFinite(by) ? Math.floor(by) : 1;
      currentProgress.value = Math.min(
        submitTotalRows.value,
        currentProgress.value + Math.max(1, increment),
      );
    },
    finish: async () => {
      // If total is zero (bulk upload without per-row progress), set to 1 so the bar can fill to 100%
      if (submitTotalRows.value <= 0) {
        submitTotalRows.value = 1;
      }

      currentProgress.value = submitTotalRows.value;
      isProgressFinishing.value = true;
      await new Promise(resolve => setTimeout(resolve, 600));
      isProgressVisible.value = false;
      isProgressFinishing.value = false;
    },
  };

  const reset = () => {
    submitTotalRows.value = 0;
    currentProgress.value = 0;
    isProgressVisible.value = false;
    isProgressFinishing.value = false;
  };

  return {
    submitTotalRows,
    currentProgress,
    isProgressVisible,
    isProgressFinishing,
    progressPercent,
    controller,
    reset,
  };
};
