export const defaultMessages = {
  en: {
    title: 'CSV Import',
    noFileSelected: 'No file selected',
    missingColumnsTitle: 'The following columns are missing:',
    columnCountMismatchTitle: 'The CSV has an unexpected number of columns',
    submitButton: 'Import',
    submitButtonProcessing: 'Importing...',
    cancelButton: 'Cancel',
    reuploadButton: 'Upload another file',
    closeButton: 'Close',
    uploadButton: 'Choose CSV File',
    rowTooltipReady: 'Ready to import',
    rowTooltipError: 'Click to jump to first error',
    rowTooltipProcessed: 'Already imported',
    rowsHaveErrors: 'One or more rows have error.',
    // Pagination with interpolation
    paginationPageOf: 'Page {current} of {total}',
    paginationShowSize: 'Show {size}',
    // Error count with pluralization
    errorCount: '{count} error | {count} errors',
    // Error word only (for navigation)
    errorWord: 'error | errors',
    // Error navigation label format
    errorNavigation: '{current}/{total} {word}',
  },
} as const;

export type MessageSchema = typeof defaultMessages.en;
