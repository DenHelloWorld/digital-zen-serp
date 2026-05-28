import { CHAR_LIMITS } from '../../modules/comon/constants/char-limits.const';

/**
 * Shared SERP preview bar helpers used by GooglePreviewComponent.
 */

export const truncateText = (value: string, limit: number): string => {
  if (!value) return '';
  return value.length <= limit ? value : `${value.slice(0, limit)}\u2026`;
};

export const getBarCount = (length: number, limit: number): number => {
  if (length === 0) return 0;
  return Math.min(5, Math.ceil((length / limit) * 5));
};

export const getTitleColor = (length: number): string => {
  if (length === 0) return 'bg-gray-200';
  if (length < 20) return 'bg-red-500';
  if (length <= 30) return 'bg-orange-500';
  if (length <= CHAR_LIMITS.title) return 'bg-green-500';
  return 'bg-red-500';
};

export const getDescriptionColor = (length: number): string => {
  if (length === 0) return 'bg-gray-200';
  if (length < 70) return 'bg-red-500';
  if (length <= 100) return 'bg-orange-500';
  if (length <= CHAR_LIMITS.description) return 'bg-green-500';
  return 'bg-red-500';
};

export const getLinkColor = (length: number): string => {
  if (length === 0) return 'bg-gray-200';
  if (length <= CHAR_LIMITS.link) return 'bg-green-500';
  return 'bg-red-500';
};
