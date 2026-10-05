// Imported documents may contain links. Only render navigable web/contact URLs.
export function safeLinkUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, 'https://slate.invalid');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value.trim() : '';
  } catch {
    return '';
  }
}
