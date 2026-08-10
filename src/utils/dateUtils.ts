import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Parses a date input (string, Date, or timestamp) and ensures
 * string ISO inputs from PostgreSQL/Supabase without timezone suffix
 * are properly treated as UTC timestamps.
 */
export function parseUTCDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  let str = dateInput.trim();
  if (!str) return null;

  // Replace space between date and time with 'T' if present (e.g., "2026-08-10 02:19:00")
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T');
  }

  // Check if timestamp already specifies a timezone indicator ('Z', '+HH:MM', or '-HH:MM' at the end)
  const hasTimezone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(str);
  if (!hasTimezone) {
    str += 'Z';
  }

  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a date to WIB (Asia/Jakarta, GMT+7) formatted string.
 */
export function formatDateWIB(
  dateInput: string | Date | number | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
  const date = parseUTCDate(dateInput);
  if (!date) return '-';

  try {
    return date.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      ...options,
    });
  } catch (err) {
    return date.toLocaleString('id-ID', options);
  }
}

/**
 * Calculates distance to now relative to WIB local time.
 */
export function formatRelativeWIB(dateInput: string | Date | number | null | undefined): string {
  const date = parseUTCDate(dateInput);
  if (!date) return '-';
  return formatDistanceToNow(date, { addSuffix: true, locale: id });
}
