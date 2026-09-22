export function htmlText(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&euro;|&#8364;/g, '€').replace(/&#39;|&apos;/g, "'").replace(/&ndash;|&#8211;/g, '–').replace(/&mdash;|&#8212;/g, '—').replace(/\s+/g, ' ').trim();
}
