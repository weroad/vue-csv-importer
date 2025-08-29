import { describe, it, expect } from 'vitest';
import * as z from 'zod';
import { extractInputType } from '../inputTypeExtractor';

describe('extractInputType', () => {
  describe('String schemas', () => {
    it('should extract text type for basic string', () => {
      const schema = z.string();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should extract text type for string with min length', () => {
      const schema = z.string().min(1);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should extract text type for string with max length', () => {
      const schema = z.string().max(255);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should extract text type for string with regex', () => {
      const schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should extract text type for string with refine', () => {
      const schema = z.string().refine(val => val.length > 0);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });
  });

  describe('Email schemas', () => {
    it('should extract email type for z.string().email()', () => {
      const schema = z.string().email();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'email' });
    });

    it('should extract email type for z.email()', () => {
      const schema = z.email();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'email' });
    });

    it('should extract email type for email with additional constraints', () => {
      const schema = z.string().email().max(255);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'email' });
    });
  });

  describe('Date schemas', () => {
    it('should handle z.date() gracefully (not supported in JSON Schema)', () => {
      const schema = z.date();
      expect(() => extractInputType(schema)).toThrow(
        'Date cannot be represented in JSON Schema',
      );
    });

    it('should extract date type for z.string().datetime()', () => {
      const schema = z.string().datetime();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'datetime' });
    });

    it('should extract date type for z.iso.date()', () => {
      const schema = z.iso.date();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'date' });
    });
  });

  describe('Number schemas', () => {
    it('should extract number type for z.number()', () => {
      const schema = z.number();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'number' });
    });

    it('should extract number type for z.number() with min', () => {
      const schema = z.number().min(0);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'number', min: 0 });
    });

    it('should extract number type for z.number() with max', () => {
      const schema = z.number().max(100);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'number', max: 100 });
    });

    it('should extract number type for z.number() with both min and max', () => {
      const schema = z.number().min(0).max(100);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'number', min: 0, max: 100 });
    });

    it('should extract number type for z.number().int()', () => {
      const schema = z.number().int();
      const result = extractInputType(schema);

      // z.int() adds min/max constraints for safe integers
      expect(result.type).toBe('number');
      expect(result.min).toBeDefined();
      expect(result.max).toBeDefined();
    });

    it('should extract number type for z.number().positive()', () => {
      const schema = z.number().positive();
      const result = extractInputType(schema);

      // z.positive() doesn't always translate to JSON Schema min constraint
      expect(result.type).toBe('number');
      expect(result.min).toBeUndefined();
      expect(result.max).toBeUndefined();
    });

    it('should extract number type for z.number().negative()', () => {
      const schema = z.number().negative();
      const result = extractInputType(schema);

      // z.negative() doesn't always translate to JSON Schema max constraint
      expect(result.type).toBe('number');
      expect(result.min).toBeUndefined();
      expect(result.max).toBeUndefined();
    });
  });

  describe('Enum schemas', () => {
    it('should extract select type for z.enum()', () => {
      const schema = z.enum(['option1', 'option2', 'option3']);
      const result = extractInputType(schema);

      expect(result).toEqual({
        type: 'select',
        options: [
          { value: 'option1', label: 'option1' },
          { value: 'option2', label: 'option2' },
          { value: 'option3', label: 'option3' },
        ],
      });
    });

    it('should extract select type for z.nativeEnum()', () => {
      enum TestEnum {
        VALUE1 = 'value1',
        VALUE2 = 'value2',
      }
      const schema = z.nativeEnum(TestEnum);
      const result = extractInputType(schema);

      expect(result).toEqual({
        type: 'select',
        options: [
          { value: 'value1', label: 'value1' },
          { value: 'value2', label: 'value2' },
        ],
      });
    });

    it('should extract select type for z.string() with refine for enum-like behavior', () => {
      const schema = z
        .string()
        .refine(
          val => ['Female', 'Male'].includes(val),
          'Gender must be either Female or Male',
        );
      const result = extractInputType(schema);

      // This should return text since refine doesn't create an enum in JSON schema
      expect(result).toEqual({ type: 'text' });
    });
  });

  describe('Union schemas', () => {
    it('should handle z.union() with string and null', () => {
      const schema = z.union([z.string(), z.null()]);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.union() with multiple types', () => {
      const schema = z.union([z.string(), z.number()]);
      const result = extractInputType(schema);

      // Should fall back to text for mixed unions
      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.union() with string and undefined gracefully (not supported in JSON Schema)', () => {
      const schema = z.union([z.string(), z.undefined()]);
      expect(() => extractInputType(schema)).toThrow(
        'Undefined cannot be represented in JSON Schema',
      );
    });
  });

  describe('Optional schemas', () => {
    it('should handle z.string().optional()', () => {
      const schema = z.string().optional();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.string().nullable()', () => {
      const schema = z.string().nullable();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.string().default()', () => {
      const schema = z.string().default('default value');
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });
  });

  describe('Complex schemas', () => {
    it('should handle z.object() with string properties', () => {
      const schema = z.object({
        name: z.string(),
        email: z.string().email(),
      });
      const result = extractInputType(schema);

      // Object schemas should fall back to text
      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.array() of strings', () => {
      const schema = z.array(z.string());
      const result = extractInputType(schema);

      // Array schemas should fall back to text
      expect(result).toEqual({ type: 'text' });
    });
  });

  describe('Edge cases', () => {
    it('should handle z.any()', () => {
      const schema = z.any();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.unknown()', () => {
      const schema = z.unknown();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.never()', () => {
      const schema = z.never();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle z.void() gracefully (not supported in JSON Schema)', () => {
      const schema = z.void();
      expect(() => extractInputType(schema)).toThrow(
        'Void cannot be represented in JSON Schema',
      );
    });
  });

  describe('Real-world examples from coordinators', () => {
    it('should handle firstName schema', () => {
      const schema = z.string().min(1).max(255);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle email schema', () => {
      const schema = z.email().max(255);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'email' });
    });

    it('should handle birthDate schema', () => {
      const schema = z.iso.date();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'date' });
    });

    it('should handle gender schema with refine', () => {
      const schema = z
        .string()
        .min(1)
        .refine(
          val => ['Female', 'Male'].includes(val),
          'Gender must be either Female or Male',
        );
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle isRepeater boolean schema', () => {
      const schema = z.boolean().optional().default(false);
      const result = extractInputType(schema);

      // Boolean schemas should fall back to text
      expect(result).toEqual({ type: 'text' });
    });

    it('should handle birthCity schema with min and max', () => {
      const schema = z.string().min(1).max(255);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle trainingWeekend schema with max constraint', () => {
      const schema = z.string().max(36).optional();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle phoneNumber schema as optional', () => {
      const schema = z.string().max(255).optional();
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });

    it('should handle regex-based date validation', () => {
      const schema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
      const result = extractInputType(schema);

      expect(result).toEqual({ type: 'text' });
    });
  });
});
