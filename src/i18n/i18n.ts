/**
 * Lightweight i18n implementation compatible with petite-vue-i18n syntax
 * Supports variable interpolation and pluralization
 */

export type I18nMessages = Record<string, string>;

export type I18nOptions = {
  locale: string;
  fallbackLocale: string;
  messages: Record<string, I18nMessages>;
};

export type I18nInstance = {
  global: {
    t: (key: string, values?: Record<string, unknown>, pluralCount?: number) => string;
  };
};

/**
 * Class-based i18n implementation with constants and methods
 */
export class I18n {
  private static readonly INTERPOLATION_REGEX = /\{(\w+)\}/g;
  private static readonly PLURALIZATION_SEPARATOR = ' | ';
  private static readonly MISSING_KEY_PREFIX = '[i18n] Missing translation for key:';

  private readonly locale: string;
  private readonly fallbackLocale: string;
  private readonly messages: Record<string, I18nMessages>;

  constructor(options: I18nOptions) {
    this.locale = options.locale;
    this.fallbackLocale = options.fallbackLocale;
    this.messages = options.messages;
  }

  /**
   * Interpolates variables in a message string
   * Replaces {variableName} with corresponding values
   */
  private interpolate(message: string, values: Record<string, unknown> = {}): string {
    return message.replace(I18n.INTERPOLATION_REGEX, (match, key) => {
      return values[key] !== undefined ? String(values[key]) : match;
    });
  }

  /**
   * Handles pluralization based on count
   * Format: "singular | plural" or "zero | one | other"
   * Examples:
   * - "item | items" with count=1 -> "item"
   * - "item | items" with count=5 -> "items"
   * - "no items | one item | {count} items" with count=0 -> "no items"
   */
  private pluralize(message: string, count: number): string {
    const parts = message.split(I18n.PLURALIZATION_SEPARATOR);
    
    if (parts.length === 1) {
      // No pluralization rules, return as-is
      return message;
    }
    
    if (parts.length === 2) {
      // Simple singular/plural: "item | items"
      return count === 1 ? parts[0] : parts[1];
    }
    
    if (parts.length >= 3) {
      // Extended format: "zero | one | other" or custom rules
      if (count === 0) {
        return parts[0];
      }
      if (count === 1) {
        return parts[1];
      }

      return parts[2];
    }
    
    return message;
  }

  /**
   * Translates a key with optional values and pluralization
   */
  public translate(key: string, values: Record<string, unknown> = {}, pluralCount?: number): string {
    // Get message from current locale or fallback
    const currentMessages = this.messages[this.locale] || {};
    const fallbackMessages = this.messages[this.fallbackLocale] || {};
    
    let message = currentMessages[key];

    if (message === undefined) {
      message = fallbackMessages[key];
    }
    
    if (message === undefined) {
      // eslint-disable-next-line no-console
      console.warn(`${I18n.MISSING_KEY_PREFIX} "${key}"`);
      return key; // Return key as fallback
    }
    
    // Handle pluralization if count is provided
    if (pluralCount !== undefined) {
      message = this.pluralize(message, pluralCount);
    }
    
    // Handle variable interpolation
    return this.interpolate(message, values);
  }

  /**
   * Gets the global translation function compatible with petite-vue-i18n API
   */
  public get global() {
    return {
      t: this.translate.bind(this),
    };
  }
}

/**
 * Creates an i18n instance with the given configuration
 */
export function createI18n(options: I18nOptions): I18nInstance {
  const i18nInstance = new I18n(options);
  return i18nInstance;
}

/**
 * Utility type for type-safe message keys
 */
export type MessageKey<T extends I18nMessages> = keyof T;

/**
 * Factory function to create a typed i18n instance
 */
export function createTypedI18n<T extends I18nMessages>(
  options: I18nOptions & { messages: Record<string, T> }
): I18nInstance & {
  global: {
    t: (key: MessageKey<T>, values?: Record<string, unknown>, pluralCount?: number) => string;
  };
} {
  return createI18n(options) as I18nInstance & {
    global: {
      t: (key: MessageKey<T>, values?: Record<string, unknown>, pluralCount?: number) => string;
    };
  };
}
