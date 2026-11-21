import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with clsx and merges Tailwind classes cleanly
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a clean URL slug from any string
 */
export function generateSlug(text: string): string {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validates whether an ID string is non-empty and well-formed
 */
export function isValidDocId(id?: any): boolean {
  if (!id) return false;
  const s = String(id).trim();
  return s.length > 0 && s !== 'undefined' && s !== 'null';
}
