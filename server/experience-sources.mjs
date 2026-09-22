import { createHash } from 'node:crypto';
import { htmlText } from './source-html.mjs';

/** Named adult public rates only. A successful parse is not a dated availability quote. */
export const EXPERIENCE_SOURCES = [
  {
    id: 'paris-bateaux-mouches', name: 'Bateaux Mouches · 官方成人游船方案',
    url: 'https://www.bateaux-mouches.fr/en/cruise/information',
    kind: 'official-experience', cityId: 'paris', experienceId: 'ex-paris-bateaux-mouches',
  },
  {
    id: 'dubai-hero-balloon', name: 'Hero Balloon Flights Dubai · Signature成人方案',
    url: 'https://uae.heroballoonflights.com/',
    kind: 'official-experience', cityId: 'dubai', experienceId: 'ex-dubai-hero-balloon',
  },
  {
    id: 'los-angeles-warner-studio', name: 'Warner Bros. Studio Tour Hollywood · 成人标准票',
    url: 'https://www.wbstudiotour.com/tour/studio/',
    kind: 'official-experience', cityId: 'los-angeles', experienceId: 'ex-los-angeles-warner-studio',
  },
];

function textOf(html) {
  if (typeof html !== 'string' || html.length > 5_000_000 || html.length < 40) throw new Error('Experience price response is missing or invalid; previous data retained');
  return htmlText(html.replace(/<!--[\s\S]*?-->/g, ' ')).replace(/[\u00a0\u202f]/g, ' ');
}
function requireContext(text, patterns, source) {
  if (patterns.some(pattern => !pattern.test(text))) throw new Error(`${source} product/location context changed; previous data retained`);
}
function between(text, start, end, source) {
  const opening = start.exec(text);
  if (!opening) throw new Error(`${source} section missing; previous data retained`);
  const rest = text.slice(opening.index + opening[0].length);
  const closing = end.exec(rest);
  if (!closing) throw new Error(`${source} section boundary missing; previous data retained`);
  return rest.slice(0, closing.index);
}
function uniqueAmount(text, pattern, min, max, label) {
  const values = [...new Set([...text.matchAll(pattern)].map(match => Number(match[1].replace(/,/g, ''))))];
  if (values.length !== 1 || !Number.isFinite(values[0]) || values[0] < min || values[0] > max) throw new Error(`${label} price missing, ambiguous or outside validation bounds; previous data retained`);
  return values[0];
}
function headingSection(html, heading, nextHeading) {
  const clean = html.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ');
  const headings = [...clean.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const starts = headings.filter(match => htmlText(match[2]).trim().toLowerCase() === heading.toLowerCase());
  if (starts.length !== 1) throw new Error(`${heading} heading missing or ambiguous; previous data retained`);
  const start = starts[0];
  const end = headings.find(match => match.index > start.index && htmlText(match[2]).trim().toLowerCase() === nextHeading.toLowerCase());
  if (!end) throw new Error(`${heading} section boundary missing; previous data retained`);
  return textOf(clean.slice(start.index + start[0].length, end.index));
}
function option(optionId, amount, currency) {
  return { optionId, amount, low: amount, high: amount, currency, unit: 'person' };
}
function result(id, html, options, evidence, scope) {
  const source = EXPERIENCE_SOURCES.find(item => item.id === id);
  return { cityId: source.cityId, experienceId: source.experienceId, currency: options[0].currency, options, evidence, scope, contentHash: createHash('sha256').update(html).digest('hex') };
}

export function parseBateauxMouches(html) {
  const text = textOf(html);
  requireContext(text, [/Bateaux[-\s]?Mouches/i, /Pont de l[’']Alma/i, /Seine/i], 'Bateaux Mouches');
  const sightseeing = between(text, /Boat Trip on the Seine/i, /Lunchtime cruise/i, 'Sightseeing cruise');
  const dinner = between(text, /Dinner cruise Times and durations/i, /Formalities and dress code/i, 'Dinner cruise');
  const adultBoat = uniqueAmount(sightseeing, /\badult\s*:\s*(\d+(?:\.\d{1,2})?)\s*€/gi, 5, 150, 'Sightseeing adult');
  const early = uniqueAmount(dinner, /Dinner menu\s*[-–—]\s*6\s*pm early bird Service\s*adult\s*:\s*(\d+(?:\.\d{1,2})?)\s*€/gi, 30, 600, '6pm early dinner adult');
  const prestige = uniqueAmount(dinner, /Prestige dinner menu\s*adult\s*:\s*(\d+(?:\.\d{1,2})?)\s*€/gi, 40, 900, 'Prestige dinner adult');
  if (!(adultBoat < early && early <= prestige)) throw new Error('Cruise product prices are inconsistent; previous data retained');
  return result('paris-bateaux-mouches', html, [option('sightseeing', adultBoat, 'EUR'), option('early-dinner', early, 'EUR'), option('prestige', prestige, 'EUR')],
    'Adult EUR amounts matched within sightseeing and named 6pm early-bird / Prestige dinner sections. Child, lunch, Discovery and Excellence fares excluded.',
    'Public adult per-person sightseeing and named dinner fares. No departure-date inventory, extras or cancellation terms queried.');
}

export function parseHeroBalloon(html) {
  const text = textOf(html);
  requireContext(text, [/Hero Balloon Flights Dubai/i, /Hot Air Balloon/i], 'Hero Dubai');
  const signature = headingSection(html, 'Signature Experience', 'Private Experience');
  requireContext(signature, [/Experience Price/i, /Days of Operations/i, /Sunrise/i], 'Signature experience');
  const adult = uniqueAmount(signature, /\bAdult\s*:\s*AED\s+([\d,]+(?:\.\d{1,2})?)/gi, 300, 8000, 'Signature adult');
  return result('dubai-hero-balloon', html, [option('signature', adult, 'AED')],
    'Unique adult AED amount extracted from the Signature section before the Private section; child and private-booking prices excluded.',
    'Shared Signature adult public rate only. Seasonal operation and participation conditions still apply; no dated flight inventory or private quotation queried.');
}

export function parseWarnerStudio(html) {
  const text = textOf(html);
  requireContext(text, [/Warner Bros\.? Studio Tour Hollywood/i, /Burbank/i, /Tour Duration/i], 'Warner Hollywood Studio Tour');
  // The repeated comparison table contains four products and child rates. Only the named
  // standard-tour headline Adult Age 11+ price is eligible for this option.
  const adult = uniqueAmount(text, /Ticket prices\s*:\s*\$\s*(\d+(?:\.\d{1,2})?)\s*Adult\s*Age\s*11\s*\+/gi, 30, 250, 'Standard Studio Tour adult age 11+');
  return result('los-angeles-warner-studio', html, [option('studio', adult, 'USD')],
    'Hollywood/Burbank identity and the standard Studio Tour headline ticket block validated; amount labelled Adult Age 11+ selected, excluding child and comparison-table upgrades.',
    'Public standard adult (age 11+) per-person base ticket. Not a reserved date, Plus upgrade, parking-inclusive quote or child ticket.');
}

export function parseExperienceSource(source, html) {
  const id = typeof source === 'string' ? source : source?.id;
  const parser = { 'paris-bateaux-mouches': parseBateauxMouches, 'dubai-hero-balloon': parseHeroBalloon, 'los-angeles-warner-studio': parseWarnerStudio }[id];
  if (!parser) throw new Error(`Unsupported experience source: ${id}`);
  return parser(html);
}
