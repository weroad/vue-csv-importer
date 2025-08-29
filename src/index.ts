import type { App, InjectionKey } from 'vue';
import type { CsvImporterConfig } from './types';

// Components
export { default as CsvImporterModal } from './CsvImporterModal.vue';

// Types
export type * from './types';

export const CSV_IMPORTER_CONFIG_KEY: InjectionKey<CsvImporterConfig> =
  Symbol('CsvImporterConfig');

export function createCsvImporter(config: CsvImporterConfig = {}): {
  install: (app: App) => void;
} {
  return {
    install(app: App) {
      app.provide(CSV_IMPORTER_CONFIG_KEY, config);
    },
  };
}
