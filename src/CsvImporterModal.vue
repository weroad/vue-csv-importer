<template>
  <Teleport to="body">
    <div v-if="isOpen" class="csvi-modal" role="dialog" aria-modal="true">
      <div class="csvi-overlay" @click="handleClose"></div>
      <div class="csvi-container">
        <div class="csvi-panel">
          <header class="csvi-header">
            <div class="csvi-header-content">
              <h3 class="csvi-title">
                {{ title || t('title') }}
              </h3>
              <div v-if="$slots.subtitle" class="csvi-subtitle">
                <slot name="subtitle" />
              </div>
            </div>
            <button
              :aria-label="t('closeButton')"
              class="csvi-close-btn"
              @click="handleClose"
            >
              ×
            </button>
          </header>

          <div
            class="csvi-progress"
            :class="{
              'csvi-progress--finishing': isProgressFinishing,
              'csvi-progress--hidden': !isProgressVisible,
            }"
          >
            <div class="csvi-progress-bar">
              <div
                class="csvi-progress-fill"
                :style="{ width: progressPercent + '%' }"
              ></div>
              <div class="csvi-progress-text">
                {{
                  `${currentProgress}/${submitTotalRows} (${progressPercent}%)`
                }}
              </div>
            </div>
          </div>

          <section class="csvi-body">
            <div v-if="!hasData" class="csvi-upload" @click="triggerFileSelect">
              <div class="csvi-upload-text">
                {{ t('noFileSelected') }}
              </div>
              <button type="button" class="csvi-upload-btn csvi-button">
                {{ t('uploadButton') }}
              </button>
              <input
                ref="fileInputRef"
                type="file"
                accept=".csv,text/csv"
                class="csvi-hidden-input"
                @change="onFileSelected"
              />
            </div>

            <div v-else class="csvi-content">
              <div v-if="hasHeaderErrors" class="csvi-alert csvi-header-error">
                <div class="csvi-header-error-title">
                  {{ headerErrorMessage || t('missingColumnsTitle') }}
                </div>
                <ul
                  v-if="!headerErrorMessage && missingColumns.length"
                  class="csvi-missing-columns-list"
                >
                  <li v-for="column in missingColumns" :key="column">
                    {{ column }}
                  </li>
                </ul>
              </div>

              <div v-if="hasFailMessage" class="csvi-alert">
                <p>{{ failMessage }}</p>
              </div>

              <div v-else-if="shouldShowRowErrorsAlert" class="csvi-alert">
                <p>{{ t('rowsHaveErrors') }}</p>
              </div>

              <div v-if="!hasHeaderErrors" class="csvi-table-container">
                <div class="csvi-table-wrapper">
                  <table class="csvi-table">
                    <thead>
                      <tr
                        v-for="headerGroup in table.getHeaderGroups()"
                        :key="headerGroup.id"
                      >
                        <th class="csvi-gutter-th"></th>
                        <th
                          v-for="header in headerGroup.headers"
                          :key="header.id"
                          class="csvi-th"
                        >
                          <div
                            v-if="!header.isPlaceholder"
                            class="csvi-th-content"
                          >
                            <FlexRender
                              :render="header.column.columnDef.header"
                              :props="header.getContext()"
                            />
                          </div>
                          <div
                            v-if="
                              !header.isPlaceholder &&
                                getColumnConfig(
                                  (header.column.columnDef.meta as ColumnMeta)
                                    ?.colIndex || 0,
                                )?.hint
                            "
                            class="csvi-hint"
                          >
                            {{
                              getColumnConfig(
                                (header.column.columnDef.meta as ColumnMeta)
                                  ?.colIndex || 0,
                              )?.hint
                            }}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="row in table.getRowModel().rows"
                        :key="row.id"
                        :data-row-index="row.index"
                        class="csvi-tr"
                        :class="getRowClasses(row.index)"
                      >
                        <!-- Gutter column -->
                        <td class="csvi-gutter-td">
                          <div class="csvi-gutter-icon">
                            <div
                              v-if="isRowBeingProcessed(row.index)"
                              class="csvi-spinner"
                            >
                              <svg class="csvi-spinner-svg" viewBox="0 0 24 24">
                                <circle
                                  class="csvi-spinner-circle"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                />
                                <path
                                  class="csvi-spinner-path"
                                  fill="none"
                                  stroke="currentColor"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  d="m15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0"
                                />
                              </svg>
                            </div>
                            <div
                              v-else
                              v-tippy="{
                                content: getRowTooltip(row.index),
                                placement: 'right',
                              }"
                              class="csvi-row-number-container"
                              role="button"
                              tabindex="0"
                              @click="scrollToFirstErrorInRow(row.index)"
                            >
                              <span
                                class="csvi-row-number"
                                :class="getGutterIconClass(row.index)"
                              >
                                {{ row.index + 1 }}
                              </span>
                              <!-- Status indicator -->
                              <div
                                v-if="isRowProcessed(row.index)"
                                class="csvi-row-status-indicator csvi-row-status-processed"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="currentColor"
                                  viewBox="0 0 16 16"
                                >
                                  <path
                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"
                                  />
                                </svg>
                              </div>
                              <div
                                v-else-if="hasRowError(row.index)"
                                class="csvi-row-status-indicator csvi-row-status-error"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="currentColor"
                                  viewBox="0 0 16 16"
                                >
                                  <path
                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z"
                                  />
                                </svg>
                              </div>
                              <div
                                v-else
                                class="csvi-row-status-indicator csvi-row-status-ready"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="currentColor"
                                  viewBox="0 0 16 16"
                                >
                                  <path
                                    d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M6.25 5C5.56 5 5 5.56 5 6.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C7.5 5.56 6.94 5 6.25 5m3.5 0c-.69 0-1.25.56-1.25 1.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C11 5.56 10.44 5 9.75 5"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </td>
                        <!-- Data columns -->
                        <td
                          v-for="cell in row.getVisibleCells()"
                          :key="cell.id"
                          class="csvi-td"
                          :class="
                            getCellClasses(
                              row.index,
                              (cell.column.columnDef.meta as ColumnMeta)?.colIndex ||
                                0,
                            )
                          "
                        >
                          <div class="csvi-cell-container">
                            <div class="csvi-input-wrapper">
                              <DynamicInput
                                :value="
                                  editableRows[row.index][
                                    (cell.column.columnDef.meta as ColumnMeta)
                                      ?.colIndex || 0
                                  ]
                                "
                                :input-type="
                                  getInputType(
                                    (cell.column.columnDef.meta as ColumnMeta)
                                      ?.colIndex || 0,
                                  )
                                "
                                :has-error="
                                  Boolean(
                                    getCellError(
                                      row.index,
                                      (cell.column.columnDef.meta as ColumnMeta)
                                        ?.colIndex || 0,
                                    ),
                                  )
                                "
                                :disabled="isProgressVisible"
                                @input="
                                  (v: string) =>
                                    updateCell(
                                      row.index,
                                      (cell.column.columnDef.meta as ColumnMeta)
                                        ?.colIndex || 0,
                                      v,
                                    )
                                "
                              />
                            </div>
                            <div
                              v-if="
                                getCellError(
                                  row.index,
                                  (cell.column.columnDef.meta as ColumnMeta)
                                    ?.colIndex || 0,
                                )
                              "
                              class="csvi-error"
                            >
                              {{
                                getCellError(
                                  row.index,
                                  (cell.column.columnDef.meta as ColumnMeta)
                                    ?.colIndex || 0,
                                )
                              }}
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Pagination Controls -->
                <div class="csvi-pagination">
                  <!-- Mobile: Error nav and page controls on same row -->
                  <div class="csvi-pagination-mobile-row">
                    <div class="csvi-pagination-error-nav">
                      <ErrorNavigator
                        v-if="hasValidationErrors"
                        :label="errorNavigationLabel"
                        :total="errorCells.length"
                        :is-disabled="isProgressVisible"
                        @prev="goToPrevError"
                        @next="goToNextError"
                      />
                    </div>
                    <div class="csvi-pagination-controls">
                      <button
                        :disabled="!table.getCanPreviousPage()"
                        class="csvi-pagination-btn"
                        aria-label="Previous page"
                        @click="table.previousPage()"
                      >
                        ‹
                      </button>
                      <span class="csvi-pagination-page">
                        {{ paginationPageText }}
                      </span>
                      <button
                        :disabled="!table.getCanNextPage()"
                        class="csvi-pagination-btn"
                        aria-label="Next page"
                        @click="table.nextPage()"
                      >
                        ›
                      </button>
                    </div>
                  </div>
                  <!-- Desktop only: Page size selector -->
                  <div class="csvi-pagination-size">
                    <select
                      :value="table.getState().pagination.pageSize"
                      class="csvi-page-size-select"
                      @change="
                        table.setPageSize(
                          Number(($event.target as HTMLSelectElement).value),
                        )
                      "
                    >
                      <option
                        v-for="size in [10, 20, 50, 100]"
                        :key="size"
                        :value="size"
                      >
                        {{ t('paginationShowSize', { size }) }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <footer class="csvi-footer">
            <!-- Mobile Layout -->
            <div class="csvi-footer-mobile">
              <div class="csvi-footer-mobile-row-1">
                <button class="csvi-cancel" @click="handleClose">
                  {{ t('cancelButton') }}
                </button>
                <button class="csvi-reupload" @click="reupload">
                  {{ t('reuploadButton') }}
                </button>
              </div>
              <div class="csvi-footer-mobile-row-2">
                <button
                  class="csvi-submit csvi-button"
                  :disabled="
                    !hasData ||
                      props.isSubmitting ||
                      hasHeaderErrors ||
                      hasValidationErrors
                  "
                  @click="handleSubmit"
                >
                  {{
                    props.isSubmitting
                      ? t('submitButtonProcessing')
                      : t('submitButton')
                  }}
                </button>
              </div>
            </div>

            <!-- Desktop Layout -->
            <div class="csvi-footer-desktop">
              <button class="csvi-reupload" @click="reupload">
                {{ t('reuploadButton') }}
              </button>

              <div class="csvi-footer-desktop-actions">
                <button class="csvi-cancel" @click="handleClose">
                  {{ t('cancelButton') }}
                </button>
                <button
                  class="csvi-submit csvi-button"
                  :disabled="
                    !hasData ||
                      props.isSubmitting ||
                      hasHeaderErrors ||
                      hasValidationErrors
                  "
                  @click="handleSubmit"
                >
                  {{
                    props.isSubmitting
                      ? t('submitButtonProcessing')
                      : t('submitButton')
                  }}
                </button>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import Papa from 'papaparse';
import {
  computed,
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  inject,
  h,
} from 'vue';
import { directive as vTippy } from 'vue-tippy';
import 'tippy.js/dist/tippy.css';
import { createI18n } from './i18n/i18n';
import { defaultMessages } from './i18n/defaultMessages';
import {
  useVueTable,
  FlexRender,
  getCoreRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/vue-table';

// Type definition for column meta data
type ColumnMeta = {
  colIndex: number;
};
import type {
  CsvImporterProps,
  CellErrorMap,
  CsvImporterConfig,
  CsvImporterColumn,
  CsvRow,
  CsvImporterSubmitData,
} from './types';
import { CSV_IMPORTER_CONFIG_KEY } from './index';
import { extractInputType } from './utils/inputTypeExtractor';
import { z, type ZodType } from 'zod';
import DynamicInput from './components/DynamicInput.vue';
import ErrorNavigator from './components/ErrorNavigator.vue';

import { createProgressBar } from './utils/progressBar';

const props = withDefaults(defineProps<CsvImporterProps>(), {
  title: 'CSV Import',
});

defineOptions({
  directives: { tippy: vTippy },
});

// Get global config if available
const injectedConfig = inject<CsvImporterConfig>(CSV_IMPORTER_CONFIG_KEY, {});

// Merge global and local csvParser configs
const csvParserConfig = computed(() => ({
  header: true,
  skipEmptyLines: true,
  ...injectedConfig.csvParser,
  ...props.csvParser,
}));

// Create i18n instance with default English messages
const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    ...defaultMessages,
    // Allow overriding with injected config and props
    en: {
      ...defaultMessages.en,
      ...injectedConfig.labels,
      ...props.labels,
    },
  },
});

// Use i18n in the component - access t function directly from global instance
const { t } = i18n.global;

// Reactive window width for responsive text
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);

if (typeof window !== 'undefined') {
  const updateWidth = () => {
    windowWidth.value = window.innerWidth;
  };
  window.addEventListener('resize', updateWidth);
  onBeforeUnmount(() => {
    window.removeEventListener('resize', updateWidth);
  });
}

const isMobile = computed(() => windowWidth.value < 768);

const errorNavigationLabel = computed(() => {
  if (errorCells.value.length === 0) {
    return '';
  }
  
  const current = errorNavIndex.value + 1; // Convert from 0-based to 1-based
  const total = errorCells.value.length;
  
  // Mobile: compact format "1/24", Desktop: full format "1/24 errors"
  if (isMobile.value) {
    return `${current}/${total}`;
  }
  
  const word = t('errorWord', {}, total);
  return t('errorNavigation', { current, total, word });
});

const paginationPageText = computed(() => {
  const current = table.getState().pagination.pageIndex + 1;
  const total = table.getPageCount();
  
  // Mobile: compact format "5/21", Desktop: full format "Page 5 of 21"
  if (isMobile.value) {
    return `${current}/${total}`;
  }
  
  return t('paginationPageOf', { current, total });
});

const fileInputRef = ref<HTMLInputElement | null>(null);
const editableRows = ref<unknown[][]>([]);
const columnHeaders = ref<string[]>([]);
const columnKeys = ref<string[]>([]);
const cellErrors = ref<CellErrorMap>({});

const processedRows = ref<Set<string>>(new Set());
const missingColumns = ref<string[]>([]);
const failMessage = ref<string>('');
const headerErrorMessage = ref<string>('');
const isNewlyImported = ref(false);

const hasData = computed(() => editableRows.value.length > 0);
const hasHeaderErrors = computed(
  () => missingColumns.value.length > 0 || Boolean(headerErrorMessage.value),
);
const hasValidationErrors = computed(
  () => Object.keys(cellErrors.value).length > 0,
);
const hasFailMessage = computed(() => Boolean(failMessage.value));
const shouldShowRowErrorsAlert = computed(() => {
  // Show default row error alert only when no custom fail message, progress ended, and there are row errors
  return (
    !hasFailMessage.value &&
    !isProgressVisible.value &&
    hasValidationErrors.value
  );
});

// File handling and data processing functions
const getUnprocessedRows = (): CsvRow[] => {
  const unprocessed: CsvRow[] = [];

  for (
    let rowNumber = 0;
    rowNumber < editableRows.value.length;
    rowNumber += 1
  ) {
    if (!isRowProcessed(rowNumber)) {
      const rowData = editableRows.value[rowNumber];
      const mappedData: Record<string | number, unknown> = {};

      if (csvParserConfig.value.header && columnKeys.value.length > 0) {
        columnKeys.value.forEach((key, colIndex) => {
          mappedData[key] = rowData[colIndex];
        });
      } else {
        rowData.forEach((value, colIndex) => {
          mappedData[colIndex] = value;
        });
      }

      unprocessed.push({
        rowNumber,
        index: unprocessed.length,
        data: mappedData,
      });
    }
  }

  return unprocessed;
};

// Function to get CSV file with only unprocessed rows
const getUnprocessedFile = (): File => {
  const unprocessedRows = getUnprocessedRows();
  
  if (unprocessedRows.length === 0) {
    return new File([''], 'empty.csv', { type: 'text/csv' });
  }

  // Convert unprocessed rows back to array format for Papa.unparse
  const unprocessedData = unprocessedRows.map(row => {
    if (csvParserConfig.value.header && columnKeys.value.length > 0) {
      // Map from object back to array using column order
      return columnKeys.value.map(key => row.data[key]);
    } else {
      // Map from object back to array using numeric indices
      return Object.keys(row.data)
        .sort((a, b) => Number(a) - Number(b))
        .map(key => row.data[key]);
    }
  });

  const csvContent = Papa.unparse({
    fields: csvParserConfig.value.header ? columnKeys.value : [],
    data: unprocessedData,
  });

  return new File([csvContent], 'import.csv', { type: 'text/csv' });
};

// Upload progress state via composable
const {
  submitTotalRows,
  currentProgress,
  isProgressVisible,
  isProgressFinishing,
  progressPercent,
  controller: progressBar,
  reset: resetProgress,
} = createProgressBar({ getUnprocessedRows });

const columnHelper = createColumnHelper<unknown[]>();

const tableColumns = computed<ColumnDef<unknown[], unknown>[]>(() => {
  return columnKeys.value.map((key, index) => {
    // const column = props.columns?.find(col => col.key === key);

    return columnHelper.accessor(row => row[index], {
      id: key,
      header: columnHeaders.value[index] || key,
      meta: {
        colIndex: index,
      },
      cell: info => {
        const rowIndex = info.row.index;
        const colIndex = index;
        const value = info.getValue();
        const errorMessage = getCellError(rowIndex, colIndex);

        return h(DynamicInput, {
          value: value,
          onInput: (newValue: unknown) =>
            updateCell(rowIndex, colIndex, newValue),
          inputType: getInputType(colIndex),
          disabled: isProgressVisible.value,
          hasError: Boolean(errorMessage),
          class: 'csvi-input-wrapper',
        });
      },
    });
  });
});

const tableData = computed(() => editableRows.value);

const table = useVueTable({
  get data() {
    return tableData.value;
  },
  get columns() {
    return tableColumns.value;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  initialState: {
    pagination: {
      pageSize: 50,
    },
  },
});

// Stable queue snapshot at progress start to avoid index shifting when rows are marked processed
const processingQueue = ref<number[]>([]);

const unprocessedRowIndices = computed(() => {
  const indices: number[] = [];
  for (let i = 0; i < editableRows.value.length; i += 1) {
    if (!isRowProcessed(i)) {
      indices.push(i);
    }
  }
  return indices;
});

watch(
  () => isProgressVisible.value,
  visible => {
    if (visible) {
      processingQueue.value = unprocessedRowIndices.value.slice();
    } else {
      processingQueue.value = [];
    }
  },
);

const currentProcessingRowIndex = computed(() => {
  if (!isProgressVisible.value || isProgressFinishing.value) {
    return -1;
  }
  if (
    submitTotalRows.value <= 0 ||
    currentProgress.value >= submitTotalRows.value
  ) {
    return -1;
  }

  // Highlight the current step within the stable snapshot
  return processingQueue.value[currentProgress.value] ?? -1;
});

const isRowBeingProcessed = (rowIndex: number): boolean => {
  return rowIndex === currentProcessingRowIndex.value;
};

// Error navigation
const errorCells = computed(() => {
  const result: { row: number; col: number }[] = [];
  const anyMap = cellErrors.value as unknown as Record<
    string,
    string | Record<number, string>
  >;
  for (const key of Object.keys(anyMap)) {
    if (key.includes('-')) {
      const [rowStr, colStr] = key.split('-');
      const row = Number(rowStr);
      const col = Number(colStr);

      if (Number.isFinite(row) && Number.isFinite(col)) {
        result.push({ row, col });
      }
    } else {
      const row = Number(key);
      const cols = anyMap[key];

      if (Number.isFinite(row) && cols && typeof cols === 'object') {
        for (const colKey of Object.keys(cols)) {
          const col = Number(colKey);

          if (Number.isFinite(col)) {
            result.push({ row, col });
          }
        }
      }
    }
  }
  return result.sort((a, b) => a.row - b.row || a.col - b.col);
});

const errorNavIndex = ref(0);

watch(errorCells, list => {
  if (list.length === 0) {
    errorNavIndex.value = 0;
  } else if (errorNavIndex.value >= list.length) {
    errorNavIndex.value = 0;

    // Automatically scroll to first error only when CSV is newly imported
    if (isNewlyImported.value) {
      const firstError = list[0];

      if (firstError) {
        scrollToCell(firstError.row, firstError.col);
        isNewlyImported.value = false; // Reset flag after first scroll
      }
    }
  } else if (errorNavIndex.value === 0 && list.length > 0) {
    // Automatically scroll to first error only when CSV is newly imported
    if (isNewlyImported.value) {
      const firstError = list[0];

      if (firstError) {
        scrollToCell(firstError.row, firstError.col);
        isNewlyImported.value = false; // Reset flag after first scroll
      }
    }
  }
});

const goToPrevError = () => {
  const total = errorCells.value.length;

  if (total === 0) {
    return;
  }

  errorNavIndex.value = (errorNavIndex.value - 1 + total) % total;

  const error = errorCells.value[errorNavIndex.value];

  if (error) {
    scrollToCell(error.row, error.col);
  }
};

const goToNextError = () => {
  const total = errorCells.value.length;

  if (total === 0) {
    return;
  }

  errorNavIndex.value = (errorNavIndex.value + 1) % total;

  const error = errorCells.value[errorNavIndex.value];

  if (error) {
    scrollToCell(error.row, error.col);
  }
};

// Utility functions
const updateCell = (
  rowIndex: number,
  colIndex: number,
  value: unknown,
): void => {
  if (editableRows.value[rowIndex]) {
    editableRows.value[rowIndex][colIndex] = value;

    validateRow(rowIndex);
  }
};

const getCellError = (
  rowIndex: number,
  colIndex: number,
): string | undefined => {
  const flatKey = `${rowIndex}-${colIndex}`;

  const flat = (cellErrors.value as Record<string, string>)[flatKey];

  if (typeof flat === 'string' && flat.length > 0) {
    return flat;
  }

  const nestedRow = (
    cellErrors.value as unknown as Record<
      number,
      Record<number, string> | undefined
    >
  )[rowIndex];

  if (nestedRow && typeof nestedRow === 'object') {
    return nestedRow[colIndex];
  }

  return undefined;
};

const isRowProcessed = (rowIndex: number): boolean => {
  return processedRows.value.has(String(rowIndex));
};

const getRowClasses = (rowIndex: number) => {
  const classes: string[] = [];

  if (isRowProcessed(rowIndex)) {
    classes.push('csvi-tr-processed');
  } else if (hasRowError(rowIndex)) {
    classes.push('csvi-tr-error');
  }

  return classes;
};

const getCellClasses = (rowIndex: number, colIndex: number) => {
  const classes: string[] = [];

  if (getCellError(rowIndex, colIndex)) {
    classes.push('csvi-td-error');
  }

  return classes;
};

const getGutterIconClass = (rowIndex: number): string => {
  if (isRowProcessed(rowIndex)) {
    return 'csvi-row-number-processed';
  }

  if (hasRowError(rowIndex)) {
    return 'csvi-row-number-error';
  }

  return 'csvi-row-number-ready';
};

const hasRowError = (rowIndex: number): boolean => {
  return columnKeys.value.some((_, colIndex) =>
    getCellError(rowIndex, colIndex),
  );
};

const getRowTooltip = (rowIndex: number): string => {
  if (isRowProcessed(rowIndex)) {
    return t('rowTooltipProcessed');
  }

  if (hasRowError(rowIndex)) {
    return t('rowTooltipError');
  }

  return t('rowTooltipReady');
};

// Column helpers (mirror original component)
const getColumnConfig = (colIndex: number): CsvImporterColumn | undefined => {
  const key = columnKeys.value[colIndex];

  if (!key) {
    return undefined;
  }

  return (props.columns || []).find(c => c.key === key);
};

const getInputType = (colIndex: number) => {
  const column = getColumnConfig(colIndex);

  if (!column) {
    return { type: 'text' as const };
  }

  return extractInputType(column.schema);
};

// Validation helpers
const toRowObject = (row: unknown[]): Record<string, unknown> => {
  const obj: Record<string, unknown> = {};
  for (let c = 0; c < columnKeys.value.length; c += 1) {
    obj[columnKeys.value[c]] = row[c];
  }
  return obj;
};

const coerceInputForSchema = (
  schema: ZodType<unknown>,
  value: unknown,
): unknown => {
  const info = extractInputType(schema);

  if (info.type === 'number') {
    try {
      return z.coerce.number().parse(value);
    } catch {
      return value;
    }
  }

  return value;
};

const validateRow = (rowIndex: number) => {
  const row = editableRows.value[rowIndex] || [];
  const rowObject = toRowObject(row);
  const nextFlat: Record<string, string> = {
    ...(cellErrors.value as Record<string, string>),
  };

  // Clear existing errors for the row
  Object.keys(nextFlat).forEach(k => {
    if (k.startsWith(`${rowIndex}-`)) {
      delete nextFlat[k];
    }
  });

  const columnMap = new Map<string, CsvImporterColumn>();
  (props.columns || []).forEach(col => {
    columnMap.set(col.key, col);
  });

  for (let colIndex = 0; colIndex < columnKeys.value.length; colIndex += 1) {
    const csvKey = columnKeys.value[colIndex];
    const column = columnMap.get(csvKey);

    if (!column) {
      continue;
    }

    const rawValue = rowObject[csvKey];
    const coerced = coerceInputForSchema(
        column.schema as unknown as ZodType<unknown>,
        rawValue,
    );
    const parsed = column.schema.safeParse(coerced);

    if (!parsed.success) {
      nextFlat[`${rowIndex}-${colIndex}`] =
          parsed.error.issues[0]?.message || 'Invalid value';
    }
  }

  cellErrors.value = nextFlat as unknown as CellErrorMap;
};

const validateAllRows = () => {
  for (let r = 0; r < editableRows.value.length; r += 1) {
    validateRow(r);
  }
};

// Navigation functions

const scrollToFirstErrorInRow = (rowIndex: number): void => {
  const firstErrorCol = columnKeys.value.findIndex((_, colIndex) =>
    getCellError(rowIndex, colIndex),
  );

  if (firstErrorCol !== -1) {
    scrollToCell(rowIndex, firstErrorCol);
  }
};

// Animate after a brief delay to allow smooth scroll to finish visually
const triggerZoomAnimation = (el: HTMLElement): void => {
  const DELAY_MS = 250;
  window.setTimeout(() => {
    el.classList.remove('csvi-animate-zoom');
    // Force reflow to restart animation if the class was present
    void el.offsetWidth;
    el.classList.add('csvi-animate-zoom');
    el.addEventListener(
      'animationend',
      () => el.classList.remove('csvi-animate-zoom'),
      { once: true },
    );
  }, DELAY_MS);
};

const scrollToCell = (rowIndex: number, colIndex: number): void => {
  // Navigate to the page containing this row
  const pageSize = table.getState().pagination.pageSize;
  const targetPage = Math.floor(rowIndex / pageSize);

  table.setPageIndex(targetPage);

  // After the page changes, attempt to center the row within the table wrapper
  // Defer to next tick to let DOM update
  queueMicrotask(() => {
    const grid = document.querySelector('.csvi-table-wrapper');
    const rowEl = grid?.querySelector(
      `tr[data-row-index="${rowIndex}"]`,
    ) as HTMLElement | null;

    if (grid instanceof HTMLElement && rowEl instanceof HTMLElement) {
      // Calculate positions manually for both axes
      const rowRect = rowEl.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const rowOffsetTop = rowEl.offsetTop;
      const rowHeight = rowRect.height;
      const gridHeight = gridRect.height;

      // Calculate target scroll position to center the row
      const targetScrollTop = rowOffsetTop - gridHeight / 2 + rowHeight / 2;

      // Calculate horizontal position for the target cell
      const cells = rowEl.querySelectorAll('.csvi-td');
      const targetCell = cells[colIndex] as HTMLElement | undefined;
      let targetScrollLeft = grid.scrollLeft;

      if (targetCell) {
        const cellRect = targetCell.getBoundingClientRect();
        const deltaLeft = cellRect.left - gridRect.left;
        targetScrollLeft = grid.scrollLeft + deltaLeft - 8;
      }

      // Use scrollTo for both axes - consistent and reliable
      grid.scrollTo({
        top: Math.max(0, targetScrollTop),
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });

      // Animate the target input wrapper for visual feedback after scroll settles
      if (targetCell) {
        const target =
          (targetCell.querySelector('.csvi-input-wrapper') as HTMLElement) ||
          targetCell;
        triggerZoomAnimation(target);
      }
    }
  });
};



const addRowError = (
  rowIndex: number,
  column: string | number,
  message: string,
): void => {
  let colIndex: number;

  if (typeof column === 'string') {
    if (csvParserConfig.value.header && columnKeys.value.length > 0) {
      colIndex = columnKeys.value.indexOf(column);

      if (colIndex === -1) {
        return;
      }
    } else {
      const numericColumn = Number(column);

      if (isNaN(numericColumn)) {
        return;
      }

      colIndex = numericColumn;
    }
  } else {
    colIndex = column;
  }

  const errorKey = `${rowIndex}-${colIndex}`;
  (cellErrors.value as Record<string, string>)[errorKey] = message;
};

const markRowAsProcessed = (rowIndex: number): void => {
  processedRows.value.add(String(rowIndex));
};

const clearRowErrors = (rowIndex: number): void => {
  const keysToDelete = Object.keys(cellErrors.value).filter(key =>
    key.startsWith(`${rowIndex}-`),
  );
  keysToDelete.forEach(key => {
    delete (cellErrors.value as Record<string, string>)[key];
  });
};

const triggerFileSelect = (): void => {
  fileInputRef.value?.click();
};

const reupload = (): void => {
  // Reset all state
  editableRows.value = [];
  columnHeaders.value = [];
  columnKeys.value = [];
  cellErrors.value = {};
  processedRows.value.clear();
  missingColumns.value = [];
  failMessage.value = '';
  headerErrorMessage.value = '';
  isNewlyImported.value = false;
  resetProgress();

  // Trigger file select
  triggerFileSelect();
};

const handleClose = (): void => {
  if (!props.isSubmitting) {
    emit('close');
  }
};

const onFileSelected = (event: Event): void => {
  const file = (event.target as HTMLInputElement).files?.[0];

  if (!file) {
    return;
  }

  // Clear previous errors and state
  cellErrors.value = {};
  processedRows.value.clear();
  missingColumns.value = [];
  failMessage.value = '';
  headerErrorMessage.value = '';
  isNewlyImported.value = true; // Mark as newly imported

  Papa.parse<Record<string, string>>(file, {
    ...csvParserConfig.value,
    complete: results => {
      if (results.errors.length > 0) {
        return;
      }

      // Process headers and data
      if (csvParserConfig.value.header && results.meta.fields) {
        const fileKeys = results.meta.fields;

        if (props.columns && props.columns.length > 0) {
          const configuredKeys = props.columns.map(col => col.key);
          const missingKeys = configuredKeys.filter(
            key => !fileKeys.includes(key),
          );

          if (missingKeys.length > 0) {
            missingColumns.value = missingKeys;
            headerErrorMessage.value = '';
            // Set minimal data to show content area with error
            editableRows.value = [[]];
            columnKeys.value = configuredKeys;
            columnHeaders.value = props.columns.map(col => col.label);
            return;
          }

          // Align both keys and headers to props.columns order
          columnKeys.value = configuredKeys.slice();
          columnHeaders.value = props.columns.map(col => col.label);

          editableRows.value = results.data.map(row =>
            columnKeys.value.map(key => row[key] ?? ''),
          );
        } else {
          // No configured columns → use file order
          columnKeys.value = fileKeys;
          columnHeaders.value = columnKeys.value;
          editableRows.value = results.data.map(row =>
            columnKeys.value.map(key => row[key] ?? ''),
          );
        }
      } else {
        // No headers mode
        if (results.data.length > 0) {
          const firstRow = results.data[0] as unknown as string[];

          if (props.columns && props.columns.length > 0) {
            // Check if column count matches configured columns
            if (firstRow.length !== props.columns.length) {
              missingColumns.value = [];
              headerErrorMessage.value = `${t('columnCountMismatchTitle')} (${firstRow.length} vs ${props.columns.length})`;
              // Set minimal data to show content area with error
              editableRows.value = [[]];
              columnKeys.value = props.columns.map(col => col.key);
              columnHeaders.value = props.columns.map(col => col.label);
              return;
            }

            // Use configured column order and labels
            columnKeys.value = props.columns.map(col => col.key);
            columnHeaders.value = props.columns.map(col => col.label);
            editableRows.value = results.data.map(row =>
              Object.values(row as Record<string, unknown>),
            );
          } else {
            // No configured columns → use file order
            columnKeys.value = firstRow.map((_, index) => String(index));
            columnHeaders.value = columnKeys.value;
            editableRows.value = results.data.map(row =>
              Object.values(row as Record<string, unknown>),
            );
          }
        }
      }

      // Validate immediately
      validateAllRows();
    },
  });
};

const handleSubmit = (): void => {
  if (props.isSubmitting || hasHeaderErrors.value) {
    return;
  }

  const submitData = {
    getUnprocessedRows,
    getUnprocessedFile,
    addRowError,
    markRowAsProcessed,
    clearRowErrors,
    progressBar,
    rawRows: editableRows.value,
    parsedRows: editableRows.value.map(row => {
      const obj: Record<string, unknown> = {};
      columnKeys.value.forEach((key, index) => {
        obj[key] = row[index];
      });
      return obj;
    }),
    fail: (message: string) => {
      failMessage.value = message;
    },
  };

  emit('submit', submitData);
};

// Lock body scroll when modal is open
watch(
  () => props.isOpen,
  open => {
    if (typeof document === 'undefined') {
      return;
    }
    if (open) {
      document.body.classList.add('csvi-modal-open');
    } else {
      document.body.classList.remove('csvi-modal-open');
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.isOpen && typeof document !== 'undefined') {
    document.body.classList.add('csvi-modal-open');
  }
});



// Define emitted events
const emit = defineEmits<{
  close: [];
  submit: [data: CsvImporterSubmitData<unknown>];
}>();

// Cleanup on unmount
onBeforeUnmount(() => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
});
</script>

<style lang="postcss" scoped>
/* Body scroll blocking when modal is open */
:global(body.csvi-modal-open) {
  overflow: hidden;
}

.csvi-table-container {
  @apply flex flex-col flex-1 min-h-0;
}

.csvi-table-wrapper {
  @apply border border-slate-200 rounded-lg overflow-auto flex-1 min-h-0;
}

.csvi-table {
  @apply w-full border-collapse;
  min-width: max-content;
}

.csvi-pagination {
  @apply flex items-center justify-between mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg;
}

.csvi-pagination-error-nav {
  @apply flex-1;
}

.csvi-pagination-controls {
  @apply flex items-center gap-2 mr-2;
}

.csvi-pagination-btn {
  @apply px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed;
}

.csvi-pagination-page {
  @apply text-sm font-medium;
}

.csvi-pagination-size {
  @apply flex items-center gap-2;
}

.csvi-page-size-select {
  @apply text-sm border border-slate-300 rounded px-2 py-1;
}

/* Rest of the existing styles from original component */
.csvi-modal {
  @apply fixed inset-0 z-[9999] flex items-center justify-center;
}
.csvi-overlay {
  @apply fixed inset-0 z-0 bg-black/40;
}
.csvi-container {
  @apply fixed inset-0 z-10 flex items-center justify-center p-2 md:p-4;
}
.csvi-panel {
  @apply relative w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden z-20 bg-white rounded-lg md:rounded-xl shadow-2xl;
}
.csvi-header {
  @apply px-4 py-3 md:px-6 md:py-4 border-b border-slate-200 flex items-center justify-between;
}
.csvi-header-content {
  @apply flex flex-col gap-1;
}
.csvi-title {
  @apply text-lg md:text-xl font-semibold text-slate-900 m-0;
}
.csvi-subtitle {
  @apply text-xs md:text-sm text-slate-400 leading-relaxed;
}
.csvi-progress {
  @apply h-4 opacity-100 transition-opacity duration-500;
}
.csvi-progress--finishing {
  @apply opacity-0;
}
.csvi-progress--hidden {
  @apply opacity-0;
}
.csvi-progress-bar {
  @apply relative w-full h-4;
  background-color: var(
    --csvi-progress-track,
    rgb(226 232 240)
  ); /* slate-200 */
}
.csvi-progress-fill {
  @apply h-4 transition-[width] duration-500 ease-[cubic-bezier(.22,1,.36,1)];
  background-color: var(--csvi-progress-fill, rgb(31 41 55)); /* slate-800 */
  will-change: width;
}
.csvi-progress-text {
  @apply absolute inset-0 flex items-center justify-center text-xs font-medium  mix-blend-difference select-none pointer-events-none text-white px-2;
}
.csvi-close-btn {
  @apply text-2xl opacity-70 hover:opacity-100 cursor-pointer;
}
.csvi-body {
  @apply flex flex-col flex-1 min-h-0 overflow-hidden px-4 py-2 md:px-6 md:py-4;
}
.csvi-content {
  @apply space-y-2 md:space-y-4 flex flex-col flex-1 min-h-0;
}
.csvi-footer {
  @apply px-4 py-3 md:px-6 md:py-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 md:gap-4;
}
.csvi-footer-mobile {
  @apply flex flex-col gap-3 md:hidden;
}
.csvi-footer-mobile-row-1 {
  @apply flex items-center justify-between gap-2 w-full;
}
.csvi-footer-mobile-row-2 {
  @apply flex items-center w-full;
}
.csvi-footer-mobile-row-2 .csvi-button {
  @apply w-full;
}
.csvi-footer-desktop {
  @apply hidden;
}
.csvi-footer-desktop-actions {
  @apply flex items-center gap-3;
}
@media (min-width: 768px) {
  .csvi-footer-mobile {
    @apply hidden;
  }
  .csvi-footer-desktop {
    @apply flex items-center justify-between w-full;
  }
}
.csvi-upload {
  @apply border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:border-slate-400 cursor-pointer transition-colors;
}
.csvi-upload-text {
  @apply text-slate-600 mb-4;
}
.csvi-upload-btn {
  @apply inline-flex items-center justify-center rounded-md border border-transparent bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors;
}
.csvi-hidden-input {
  @apply sr-only;
}
.csvi-button {
  @apply inline-flex items-center justify-center rounded-md border border-transparent bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}
.csvi-cancel {
  @apply inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors;
}
.csvi-reupload {
  @apply inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors;
}
.csvi-submit {
  @apply w-full;
}
.csvi-alert {
  @apply bg-red-50 border border-red-200 text-red-800 px-3 py-2 md:px-4 md:py-3 rounded-md text-sm;
}
.csvi-header-error {
  @apply bg-red-50 border-red-200;
}
.csvi-header-error-title {
  @apply font-medium text-sm;
}
.csvi-alert-jump {
  @apply text-red-600 underline cursor-pointer hover:text-red-800 text-sm font-semibold;
}
.csvi-missing-columns-list {
  @apply list-disc pl-7 mt-2;
}
.csvi-missing-columns-list li {
  @apply text-left;
}
.csvi-th {
  @apply px-2 py-1.5 md:px-3 md:py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0 z-10;
  min-width: 120px;
}
.csvi-th-content {
  @apply flex items-center font-semibold gap-2;
}
.csvi-hint {
  @apply text-xs text-slate-500 mt-0.5 md:mt-1 font-normal normal-case tracking-normal;
}
.csvi-gutter-th {
  @apply w-16 px-2 py-2 bg-slate-50 border-b border-slate-200 sticky top-0 z-10;
}
.csvi-tr {
  @apply border-b border-slate-100 hover:bg-slate-50;
  min-height: 4rem;
}
.csvi-tr-processed {
  @apply bg-green-50;
}
.csvi-tr-error {
  @apply bg-red-50;
}
.csvi-tr-error:hover {
  @apply bg-red-100;
}
.csvi-td {
  @apply px-2 py-1.5 md:px-3 md:py-2 border-b border-slate-100 relative;
  min-width: 120px;
  vertical-align: top;
}
.csvi-input-wrapper {
  @apply w-full;
}
.csvi-input {
  @apply w-full h-8 border border-slate-300 rounded text-sm px-2 bg-white m-0;
}
.csvi-input:disabled {
  @apply opacity-50 !cursor-default bg-slate-100;
}
.csvi-input-error {
  @apply border-red-300 ring-1 ring-red-100;
}
/* Pagination styles */
.csvi-pagination {
  @apply flex flex-col gap-2 p-4 md:gap-3 md:p-4 border-t border-slate-200 bg-slate-50 md:flex-row md:items-center md:justify-between;
}
.csvi-pagination-mobile-row {
  @apply flex items-center gap-2 w-full md:contents;
}
.csvi-pagination-error-nav {
  @apply flex items-center justify-center flex-1 md:flex-none md:w-auto md:justify-start;
}
.csvi-pagination-controls {
  @apply flex items-center justify-center gap-1 md:gap-2 flex-1 md:flex-none md:w-auto;
}
.csvi-pagination-btn {
  @apply px-2 py-0.5 md:px-3 md:py-1 border border-slate-300 bg-white rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm w-8 h-7 md:w-auto md:h-auto flex items-center justify-center;
}
.csvi-pagination-page {
  @apply text-xs md:text-sm text-slate-600 px-1 md:px-2 font-medium;
}
.csvi-pagination-size {
  @apply hidden md:flex md:items-center md:justify-end;
}
.csvi-page-size-select {
  @apply text-sm border border-slate-300 rounded px-2 py-1 bg-white;
}

.csvi-gutter-td {
  @apply w-16 px-2 py-2 text-center border-b border-slate-100;
}
.csvi-gutter-td svg {
  @apply w-3.5 h-3.5;
}
.csvi-gutter-icon {
  @apply flex items-center justify-center;
}
.csvi-row-icon {
  @apply block mt-2;
}
.csvi-row-icon--ready {
  @apply text-yellow-500;
}
.csvi-row-icon--error {
  @apply text-red-600;
}
.csvi-row-icon--processed {
  @apply text-green-600;
}
.csvi-row-icon--processing {
  @apply text-slate-600;
}
.csvi-row-icon--processing svg {
  @apply animate-spin;
}
.csvi-row-icon--clickable {
  @apply cursor-pointer;
}
.csvi-tr--processed {
  @apply bg-green-50;
}
.csvi-cell-container {
  @apply w-full;
}
.csvi-error {
  @apply text-xs text-red-600 mt-1 leading-tight;
}
.csvi-row-number-container {
  @apply relative inline-flex items-center justify-center cursor-pointer;
}
.csvi-row-number {
  @apply inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full transition-all;
}
.csvi-row-status-indicator {
  @apply absolute -bottom-1 -right-1.5 w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center;
}
.csvi-row-status-indicator svg {
  @apply w-2.5 h-2.5;
}
.csvi-row-status-processed {
  @apply bg-green-500 text-white;
}
.csvi-row-status-error {
  @apply bg-red-500 text-white;
}
.csvi-row-status-ready {
  @apply bg-blue-500 text-white;
}
.csvi-row-number-ready {
  @apply bg-blue-100 text-blue-600 hover:bg-blue-200;
}
.csvi-row-number-error {
  @apply bg-red-200 text-red-600 hover:bg-red-200;
}
.csvi-row-number-processed {
  @apply bg-green-100 text-green-600;
}
.csvi-spinner {
  @apply inline-flex items-center justify-center w-6 h-6;
}
.csvi-spinner-svg {
  @apply w-4 h-4 text-blue-600 animate-spin;
}
.csvi-spinner-circle {
  opacity: 0.25;
}
.csvi-spinner-path {
  opacity: 0.75;
}

/* Polyfills for colors */
.bg-slate-800 {
  background-color: #1e293b;
}
.hover\:bg-slate-700:hover {
  background-color: #334155;
}
.bg-slate-50 {
  background-color: #f8fafc;
}
.border-slate-200 {
  border-color: #e2e8f0;
}
.border-slate-300 {
  border-color: #cbd5e1;
}
.text-slate-500 {
  color: #64748b;
}
.text-slate-600 {
  color: #475569;
}
.text-slate-700 {
  color: #334155;
}
.text-slate-900 {
  color: #0f172a;
}
.hover\:bg-slate-50:hover {
  background-color: #f8fafc;
}
.bg-slate-100 {
  background-color: #f1f5f9;
}
.hover\:bg-slate-100:hover {
  background-color: #f1f5f9;
}
.bg-slate-200 {
  background-color: #e2e8f0;
}

/* Status indicator colors */
.bg-green-500 {
  background-color: #10b981;
}
.bg-red-500 {
  background-color: #ef4444;
}
.bg-blue-500 {
  background-color: #3b82f6;
}

/* Animation for highlighting cells */
.csvi-animate-zoom {
  animation: csvi-zoom 1000ms ease-out;
}

@keyframes csvi-zoom {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
  30% {
    transform: scale(1.035);
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.15);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}
</style>
