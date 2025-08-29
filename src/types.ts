import type { z } from 'zod';

export type CsvImporterColumn<T = unknown> = {
  key: string;
  label: string;
  /** Zod schema for this specific column */
  schema: z.ZodType<T>;
  /** Helper text shown under header and next to cell error */
  hint?: string;
  /** Column width in pixels (e.g., 200) or CSS units (e.g., '200px', '15rem') */
  width?: number | string;
};

export type CsvImporterSubmitData<T = unknown> = {
  rawRows: unknown[][];
  parsedRows: T[];
  fail: (message: string) => void;
  addRowError: (row: number, column: string | number, message: string) => void;
  markRowAsProcessed: (rowIndex: number) => void;
  /** Returns a list of objects describing each unprocessed row */
  getUnprocessedRows: () => CsvRow[];
  /** Returns a CSV File containing only unprocessed rows */
  getUnprocessedFile: () => File;
  /** Progress bar controller for upload feedback */
  progressBar: CsvImporterProgressBar;
};

export type CsvImporterProps = {
  isOpen: boolean;
  isSubmitting?: boolean;
  title?: string;
  columns: CsvImporterColumn[];
  csvParser?: Partial<Papa.ParseConfig>;
  /** Component-level labels (overrides global labels) */
  labels?: Partial<CsvImporterLabels>;
};

export type CellErrorMap = Record<number, Record<number, string>>;

export type CsvImporterRowError = {
  row: number;
  column: string;
  error: string;
};

export type CsvImporterProgressBar = {
  /** Show the bar at 0% */
  start: () => void;
  /** Increment progress by N (default 1), capped to total */
  advance: (by?: number) => void;
  /** Complete with a brief fade-out */
  finish: () => Promise<void> | void;
};

export type ModalUI = {
  /** Root modal container */
  modal?: string;
  /** Modal backdrop/overlay */
  overlay?: string;
  /** Modal content container */
  container?: string;
  /** Modal panel/card */
  panel?: string;
  /** Modal header section */
  header?: string;
  /** Modal title */
  title?: string;
  /** Modal body section */
  body?: string;
  /** Modal footer section */
  footer?: string;
  /** File upload area */
  upload?: string;
  /** Missing columns alert */
  alert?: string;
  /** Grid container */
  grid?: string;
  /** Grid header row */
  thead?: string;
  /** Grid header cell */
  th?: string;
  /** Grid data row */
  tbody?: string;
  /** Grid data cell */
  td?: string;
  /** Input field */
  input?: string;
  /** Error message */
  error?: string;
  /** Button base styles */
  button?: string;
  /** Primary button */
  submitButton?: string;
  /** Secondary button */
  cancelButton?: string;
  /** Re-upload button */
  reuploadButton?: string;
};

export type CsvImporterLabels = {
  /** Title for the modal (default: "CSV Import") */
  title?: string;
  /** Text for the file upload area when no file is selected */
  noFileSelected?: string;
  /** Text for the upload button */
  uploadButton?: string;
  /** Text for the missing columns alert */
  missingColumnsTitle?: string;
  /** Title for a column count mismatch */
  columnCountMismatchTitle?: string;
  /** Text for the submit button */
  submitButton?: string;
  /** Text for the submit button when processing */
  submitButtonProcessing?: string;
  /** Text for the cancel button */
  cancelButton?: string;
  /** Text for the re-upload button */
  reuploadButton?: string;
  /** Text for the close button (aria-label) */
  closeButton?: string;
  /** Tooltip for a row that is ready (no errors, editable) */
  rowTooltipReady?: string;
  /** Tooltip for a row with validation errors */
  rowTooltipError?: string;
  /** Tooltip for a row already processed */
  rowTooltipProcessed?: string;
  /** Alert copy when there are row errors after submit */
  rowsHaveErrors?: string;
  /** Action text to jump to first row error */
  jumpToFirstError?: string;
  /** Word used in error navigator when exactly one error (contextual) */
  errorNavigatorSingular?: string;
  /** Word used in error navigator when zero or multiple errors (contextual) */
  errorNavigatorPlural?: string;
};

export type CsvImporterConfig = {
  csvParser?: Partial<Papa.ParseConfig>;
  /** Global labels for the CSV importer */
  labels?: CsvImporterLabels;
};

export type CsvImporterMessages = {
  /** Compute the missing columns alert message */
  missingColumnsMessage?: (missing: string[]) => string;
};

export type WeRoadAuth = {
  accessToken: string;
};

export type WeRoadApp = {
  $auth: WeRoadAuth;
  $config: {
    public: {
      apiBaseUrl: string;
    };
  };
};

/** A single unprocessed row returned by getUnprocessedRows */
export type CsvRow = {
  /** Original row index from the CSV/grid */
  rowNumber: number;
  /** 0-based position inside the current unprocessed queue */
  index: number;
  /** Mapped values: header name -> value, or columnIndex -> value if no headers */
  data: Record<string | number, unknown>;
};
