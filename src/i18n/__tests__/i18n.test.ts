import { describe, it, expect, vi } from 'vitest';
import { createI18n, createTypedI18n } from '../i18n';

describe('Custom i18n Implementation', () => {
  const testMessages = {
    en: {
      simple: 'Hello World',
      withVariable: 'Hello {name}',
      withMultipleVars: 'Hello {name}, you have {count} items',
      pluralSimple: 'item | items',
      pluralWithCount: '{count} item | {count} items',
      pluralExtended: 'no items | one item | {count} items',
      missing: 'This key does not exist',
    },
    es: {
      simple: 'Hola Mundo',
      withVariable: 'Hola {name}',
    },
  };

  describe('createI18n', () => {
    it('should create an i18n instance with global.t function', () => {
      const i18n = createI18n({
        locale: 'en',
        fallbackLocale: 'en',
        messages: testMessages,
      });

      expect(i18n.global).toBeDefined();
      expect(typeof i18n.global.t).toBe('function');
    });
  });

  describe('Basic Translation', () => {
    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: testMessages,
    });

    it('should translate simple messages', () => {
      expect(i18n.global.t('simple')).toBe('Hello World');
    });

    it('should handle missing keys by returning the key', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
        // Mock implementation for testing
      });
      expect(i18n.global.t('nonexistent')).toBe('nonexistent');
      expect(consoleSpy).toHaveBeenCalledWith('[i18n] Missing translation for key: "nonexistent"');
      consoleSpy.mockRestore();
    });

    it('should fallback to fallback locale', () => {
      const i18nWithFallback = createI18n({
        locale: 'fr', // Non-existent locale
        fallbackLocale: 'en',
        messages: testMessages,
      });

      expect(i18nWithFallback.global.t('simple')).toBe('Hello World');
    });
  });

  describe('Variable Interpolation', () => {
    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: testMessages,
    });

    it('should interpolate single variables', () => {
      expect(i18n.global.t('withVariable', { name: 'John' })).toBe('Hello John');
    });

    it('should interpolate multiple variables', () => {
      expect(i18n.global.t('withMultipleVars', { name: 'John', count: 5 })).toBe('Hello John, you have 5 items');
    });

    it('should handle missing variables by keeping placeholder', () => {
      expect(i18n.global.t('withVariable', {})).toBe('Hello {name}');
    });

    it('should handle extra variables gracefully', () => {
      expect(i18n.global.t('simple', { extra: 'value' })).toBe('Hello World');
    });

    it('should convert non-string values to strings', () => {
      expect(i18n.global.t('withVariable', { name: 42 })).toBe('Hello 42');
      expect(i18n.global.t('withVariable', { name: true })).toBe('Hello true');
    });
  });

  describe('Pluralization', () => {
    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: testMessages,
    });

    describe('Simple Pluralization (singular | plural)', () => {
      it('should return singular for count = 1', () => {
        expect(i18n.global.t('pluralSimple', {}, 1)).toBe('item');
      });

      it('should return plural for count = 0', () => {
        expect(i18n.global.t('pluralSimple', {}, 0)).toBe('items');
      });

      it('should return plural for count > 1', () => {
        expect(i18n.global.t('pluralSimple', {}, 5)).toBe('items');
      });

      it('should interpolate variables in plural forms', () => {
        expect(i18n.global.t('pluralWithCount', { count: 1 }, 1)).toBe('1 item');
        expect(i18n.global.t('pluralWithCount', { count: 5 }, 5)).toBe('5 items');
      });
    });

    describe('Extended Pluralization (zero | one | other)', () => {
      it('should return zero form for count = 0', () => {
        expect(i18n.global.t('pluralExtended', { count: 0 }, 0)).toBe('no items');
      });

      it('should return one form for count = 1', () => {
        expect(i18n.global.t('pluralExtended', { count: 1 }, 1)).toBe('one item');
      });

      it('should return other form for count > 1', () => {
        expect(i18n.global.t('pluralExtended', { count: 5 }, 5)).toBe('5 items');
      });
    });

    describe('No Pluralization', () => {
      it('should return message as-is when no plural rules defined', () => {
        expect(i18n.global.t('simple', {}, 5)).toBe('Hello World');
      });
    });
  });

  describe('Combined Features', () => {
    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: testMessages,
    });

    it('should handle both interpolation and pluralization', () => {
      expect(i18n.global.t('pluralWithCount', { count: 1, name: 'John' }, 1)).toBe('1 item');
      expect(i18n.global.t('pluralWithCount', { count: 3, name: 'John' }, 3)).toBe('3 items');
    });
  });

  describe('Locale Switching', () => {
    it('should use correct locale messages', () => {
      const i18nEn = createI18n({
        locale: 'en',
        fallbackLocale: 'en',
        messages: testMessages,
      });

      const i18nEs = createI18n({
        locale: 'es',
        fallbackLocale: 'en',
        messages: testMessages,
      });

      expect(i18nEn.global.t('simple')).toBe('Hello World');
      expect(i18nEs.global.t('simple')).toBe('Hola Mundo');
    });

    it('should fallback when translation missing in current locale', () => {
      const i18nEs = createI18n({
        locale: 'es',
        fallbackLocale: 'en',
        messages: testMessages,
      });

      // 'withMultipleVars' only exists in English
      expect(i18nEs.global.t('withMultipleVars', { name: 'Juan', count: 3 })).toBe('Hello Juan, you have 3 items');
    });
  });

  describe('createTypedI18n', () => {
    it('should create a typed i18n instance', () => {
      const typedI18n = createTypedI18n({
        locale: 'en',
        fallbackLocale: 'en',
        messages: testMessages,
      });

      expect(typedI18n.global.t('simple')).toBe('Hello World');
      expect(typeof typedI18n.global.t).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    const i18n = createI18n({
      locale: 'en',
      fallbackLocale: 'en',
      messages: {
        en: {
          empty: '',
          special: 'Message with {special} characters like {} and {unknown}',
          multipleSpaces: 'Multiple  |  spaces  |  test',
        },
      },
    });

    it('should handle empty messages', () => {
      expect(i18n.global.t('empty')).toBe('');
    });

    it('should handle special characters in interpolation', () => {
      expect(i18n.global.t('special', { special: '💎' })).toBe('Message with 💎 characters like {} and {unknown}');
    });

    it('should handle messages with extra spaces in pluralization', () => {
      // With message: 'Multiple  |  spaces  |  test'
      // When split by ' | ' we get: ['Multiple ', ' spaces ', ' test']
      // Extended format: zero | one | other
      expect(i18n.global.t('multipleSpaces', {}, 0)).toBe('Multiple '); // zero form
      expect(i18n.global.t('multipleSpaces', {}, 1)).toBe(' spaces '); // one form  
      expect(i18n.global.t('multipleSpaces', {}, 2)).toBe(' test'); // other form
    });
  });
});
