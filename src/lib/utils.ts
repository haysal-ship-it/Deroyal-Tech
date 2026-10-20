import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format any number or numeric string as Nigerian Naira (e.g. ₦12,500.00)
 */
export function formatNaira(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Returns a local date string in YYYY-MM-DD format (not UTC)
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts a local YYYY-MM-DD string from Firestore Timestamp, Date, or string
 */
export function getDateStringFromTimestamp(ts: any): string {
  if (!ts) return '';
  if (typeof ts.toDate === 'function') {
    return getLocalDateString(ts.toDate());
  }
  if (ts instanceof Date) {
    return getLocalDateString(ts);
  }
  if (typeof ts === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(ts)) return ts;
    const parsed = new Date(ts);
    if (!isNaN(parsed.getTime())) return getLocalDateString(parsed);
    return ts;
  }
  return '';
}

/**
 * Validates Nigerian phone numbers (e.g., 0803 000 0000, 08012345678, +2348012345678)
 */
export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  return /^(?:(?:\+?234)|0)[789][01]\d{8}$/.test(cleaned);
}
