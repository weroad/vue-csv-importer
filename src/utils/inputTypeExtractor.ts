import * as z from 'zod';
import type { ZodType } from 'zod';

export type InputType =
  | 'text'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select';

export type SelectOption = {
  value: string;
  label: string;
};

export type InputTypeInfo = {
  type: InputType;
  options?: SelectOption[];
  min?: number;
  max?: number;
};

type JsonSchema = {
  type?: string;
  format?: string;
  enum?: unknown[];
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  minimum?: number;
  maximum?: number;
};

export function extractInputType(schema: ZodType<unknown>): InputTypeInfo {
  // Convert the Zod schema to JSON Schema (input view)
  const js = z.toJSONSchema(schema, { io: 'input' }) as JsonSchema;
  const field = unwrapJsonSchema(js);

  // Enum → select
  if (Array.isArray(field.enum) && field.enum.length > 0) {
    const options = field.enum
      .filter((v): v is string => typeof v === 'string')
      .map(v => ({ value: v, label: v }));

    if (options.length) {
      return { type: 'select', options };
    }
  }

  // Numbers (number | integer)
  if (field.type === 'number' || field.type === 'integer') {
    const min = typeof field.minimum === 'number' ? field.minimum : undefined;
    const max = typeof field.maximum === 'number' ? field.maximum : undefined;
    return { type: 'number', min, max };
  }

  // Strings with formats
  if (field.type === 'string') {
    switch (field.format) {
    case 'email':
      return { type: 'email' };
    case 'date':
      return { type: 'date' };
    case 'date-time':
      return { type: 'datetime' };
    default:
      return { type: 'text' };
    }
  }

  // Fallback
  return { type: 'text' };
}

function unwrapJsonSchema(schema: JsonSchema): JsonSchema {
  // Prefer non-null entry among oneOf/anyOf if present
  const pick = (arr?: JsonSchema[]) =>
    arr?.find(s => s && (s.type ?? '') !== 'null');
  const fromOne = pick(schema.oneOf);

  if (fromOne) {
    return fromOne;
  }

  const fromAny = pick(schema.anyOf);

  if (fromAny) {
    return fromAny;
  }

  // allOf: take the first subschema if available
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    return schema.allOf[0] as JsonSchema;
  }

  return schema;
}
