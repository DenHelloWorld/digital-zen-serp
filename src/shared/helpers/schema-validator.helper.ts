import type { ValidationMessage } from '../models/og-data.model';
import type {
  SchemaBlock,
  SchemaBlockStatus,
  SchemaPropertyRow,
  SchemaPropertyStatus,
} from '../models/schema-data.model';
import { SCHEMA_RULES_MAP } from './schema-rules/schema-rules.const';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/;
const URL_RE = /^https?:\/\/.+/;

const m = (key: string, params?: Record<string, unknown>): ValidationMessage => ({ key, params });

const stringify = (val: unknown): string | null => {
  if (val == null) return null;
  if (typeof val === 'string') return val || null;
  if (typeof val === 'object') return JSON.stringify(val).slice(0, 120);
  return String(val);
};

const hasValue = (val: unknown): boolean => {
  if (val == null) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'object') return Object.keys(val as object).length > 0;
  return true;
};

const statusFor = (statuses: SchemaPropertyStatus[]): SchemaBlockStatus => {
  if (statuses.some(s => s === 'invalid' || s === 'missing')) return 'has-errors';
  if (statuses.some(s => s === 'warning')) return 'has-warnings';
  return 'valid';
};

export const validateSchemaBlock = (block: SchemaBlock): SchemaBlock => {
  if (block.overallStatus === 'broken') return block;

  const rule = SCHEMA_RULES_MAP.get(block.type.toLowerCase());
  if (!rule) {
    const rows: SchemaPropertyRow[] = Object.entries(block.properties).map(([k, v]) => ({
      property: k,
      value: stringify(v),
      status: 'ok',
    }));
    return { ...block, rows, overallStatus: 'valid' };
  }

  const rows: SchemaPropertyRow[] = [];

  const validateValue = (field: string, strVal: string): SchemaPropertyRow | null => {
    if (
      rule.urlFields.includes(field) &&
      !URL_RE.test(strVal) &&
      strVal[0] !== '{' &&
      strVal[0] !== '['
    )
      return {
        property: field,
        value: strVal,
        status: 'invalid',
        message: m('social.schema.msg.invalid_url'),
      };
    if (rule.dateFields.includes(field) && !ISO_DATE_RE.test(strVal))
      return {
        property: field,
        value: strVal,
        status: 'invalid',
        message: m('social.schema.msg.invalid_date'),
      };
    if (rule.enumFields[field] && !rule.enumFields[field].includes(strVal))
      return {
        property: field,
        value: strVal,
        status: 'invalid',
        message: m('social.schema.msg.invalid_enum', {
          values: rule.enumFields[field].slice(0, 4).join(', '),
        }),
      };
    return null;
  };

  for (const field of rule.required) {
    const val = block.properties[field];
    if (!hasValue(val)) {
      rows.push({
        property: field,
        value: null,
        status: 'missing',
        message: m('social.schema.msg.required_missing'),
      });
      continue;
    }
    const strVal = stringify(val)!;
    rows.push(validateValue(field, strVal) ?? { property: field, value: strVal, status: 'ok' });
  }

  for (const field of rule.recommended) {
    const val = block.properties[field];
    if (!hasValue(val)) {
      rows.push({
        property: field,
        value: null,
        status: 'warning',
        message: m('social.schema.msg.recommended_missing'),
      });
      continue;
    }
    const strVal = stringify(val)!;
    rows.push(validateValue(field, strVal) ?? { property: field, value: strVal, status: 'ok' });
  }

  const knownFields = new Set([...rule.required, ...rule.recommended]);
  for (const [k, v] of Object.entries(block.properties)) {
    if (knownFields.has(k)) continue;
    rows.push({ property: k, value: stringify(v), status: 'ok' });
  }

  const overallStatus = statusFor(rows.map(r => r.status));
  return { ...block, rows, overallStatus };
};
