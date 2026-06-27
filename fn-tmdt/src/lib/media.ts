const API_BASE = import.meta.env.VITE_API_URL || '';

/** Prepend API_BASE to relative /uploads/... paths. Absolute URLs pass through unchanged. */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return url;
  return `${API_BASE}${url}`;
}
