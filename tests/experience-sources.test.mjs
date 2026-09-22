import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPERIENCE_SOURCES, parseBateauxMouches, parseHeroBalloon, parseWarnerStudio, parseExperienceSource } from '../server/experience-sources.mjs';

// Minimal source-shaped fixtures exercise identity, adult labels and product boundaries.
const cruise = `<title>Bateaux-Mouches</title><p>Seine departure: Pont de l'Alma</p>
<h2>Boat Trip on the Seine</h2><h3>Tarifs</h3><p>adult : 20€</p><p>Children : 10€</p>
<h2>Lunchtime cruise</h2><p>Douce France Menu adult : 90.00 €</p>
<h2>Dinner cruise</h2><h3>Times and durations</h3><p>Boarding info</p>
<p>Dinner menu - 6pm early bird Service<br>adult : 90.00 € / adult<br>child : 45.00 €</p>
<p>Discovery Menu - Dinner Cruise adult : 99.00 €</p>
<p>Prestige dinner menu<br>adult : 135.00 € / adult<br>child : 45.00 €</p>
<p>Excellence dinner menu adult : 170.00 €</p><h2>Formalities and dress code</h2>`;
const hero = `<title>Hero Balloon Flights Dubai</title><h1>Hot Air Balloon Flights</h1>
<h4><span>Signature</span> Experience</h4><p>Days of Operations: Daily, 1st October - 31st May</p>
<p>Sunrise, Half Day</p><span>Experience Price:</span><p>Adult: AED 1,695 | Child: AED 1,395</p>
<h4>Private Experience</h4><p>Experience Price: Starting from AED 12,950 for two guests</p>`;
const warner = `<title>Warner Bros. Studio Tour Hollywood</title><p>3400 Warner Blvd. Burbank</p>
<h1>Studio Tour</h1><p>Tour Duration: 45-60 mins guided + 2 hours unguided</p>
<div>Ticket prices:<a><span>$</span><strong>79</strong><h5>Adult</h5><h6>Age 11+</h6></a>
<a>$68 Child Age 5-10</a></div><p>Compare tours: Ticket Price (age 11+) $79 $99 $160 $330</p>`;

test('cruise maps adult named products, ignoring lunch, child and upgrades', () => {
  const parsed = parseBateauxMouches(cruise);
  assert.deepEqual(parsed.options.map(o => [o.optionId, o.low, o.high, o.currency]), [['sightseeing', 20, 20, 'EUR'], ['early-dinner', 90, 90, 'EUR'], ['prestige', 135, 135, 'EUR']]);
  assert.equal(parsed.experienceId, 'ex-paris-bateaux-mouches');
  assert.match(parsed.contentHash, /^[a-f0-9]{64}$/);
});
test('cruise reads revised fares instead of freezing curated values', () => {
  const parsed = parseBateauxMouches(cruise.replace('20€', '24€').replace('90.00 € / adult', '96.50 € / adult').replace('135.00', '141.25'));
  assert.deepEqual(parsed.options.map(o => o.amount), [24, 96.5, 141.25]);
});
test('cruise refuses confusing a lunch-only rate with early dinner', () => {
  assert.throws(() => parseBateauxMouches(cruise.replace('Dinner menu - 6pm early bird Service', 'Removed early service')), /early dinner adult/);
});
test('cruise refuses missing adult fare, wrong currency and conflicting named prices', () => {
  assert.throws(() => parseBateauxMouches(cruise.replace('adult : 20€', 'Child : 20€')), /Sightseeing adult/);
  assert.throws(() => parseBateauxMouches(cruise.replace('20€', '20 USD')), /Sightseeing adult/);
  assert.throws(() => parseBateauxMouches(cruise.replace('adult : 20€', 'adult : 20€ adult : 25€')), /ambiguous/);
});
test('cruise fails closed when section boundaries or identity change', () => {
  assert.throws(() => parseBateauxMouches(cruise.replace('Lunchtime cruise', 'Changed heading')), /boundary/);
  assert.throws(() => parseBateauxMouches(cruise.replace('Bateaux-Mouches', 'Different provider')), /context/);
});
test('Hero selects Signature adult price, never child or private pair price', () => {
  const parsed = parseHeroBalloon('<nav>Signature Experience Private Experience</nav>' + hero);
  assert.deepEqual(parsed.options, [{ optionId: 'signature', amount: 1695, low: 1695, high: 1695, currency: 'AED', unit: 'person' }]);
});
test('Hero reads changed adult price but refuses child-only / duplicate adult ambiguity', () => {
  assert.equal(parseHeroBalloon(hero.replace('1,695', '1,725')).options[0].amount, 1725);
  assert.throws(() => parseHeroBalloon(hero.replace('Adult: AED 1,695', 'Sold out')), /Signature adult/);
  assert.throws(() => parseHeroBalloon(hero.replace('Adult: AED 1,695', 'Adult: AED 1,695 Adult: AED 1,795')), /ambiguous/);
});
test('Hero requires Dubai identity, Signature boundary and AED', () => {
  assert.throws(() => parseHeroBalloon(hero.replace('Hero Balloon Flights Dubai', 'Hero Balloon Flights AlUla')), /context/);
  assert.throws(() => parseHeroBalloon(hero.replace('Private Experience', 'Different product')), /boundary/);
  assert.throws(() => parseHeroBalloon(hero.replace('Adult: AED', 'Adult: USD')), /Signature adult/);
});
test('Warner selects standard adult 11+ fare from nested markup', () => {
  const parsed = parseWarnerStudio(warner);
  assert.equal(parsed.experienceId, 'ex-los-angeles-warner-studio');
  assert.deepEqual(parsed.options, [{ optionId: 'studio', amount: 79, low: 79, high: 79, currency: 'USD', unit: 'person' }]);
});
test('Warner ignores an upgrade-table amount and accepts labelled price changes', () => {
  assert.equal(parseWarnerStudio(warner.replace('<strong>79</strong>', '<strong>83.50</strong>')).options[0].amount, 83.5);
  assert.throws(() => parseWarnerStudio(warner.replace('Ticket prices:', 'Removed current ticket')), /missing/);
});
test('Warner refuses child, different age cutoff or wrong location', () => {
  assert.throws(() => parseWarnerStudio(warner.replace('<h5>Adult</h5>', '<h5>Child</h5>')), /missing/);
  assert.throws(() => parseWarnerStudio(warner.replace('Age 11+', 'Age 12+')), /missing/);
  assert.throws(() => parseWarnerStudio(warner.replace('Hollywood', 'London')), /context/);
});
test('scripts and HTML comments cannot inject a price', () => {
  const deceptive = warner.replace('Ticket prices:', 'Removed price') + '<script>Ticket prices: $79 Adult Age 11+</script><!-- Ticket prices: $79 Adult Age 11+ -->';
  assert.throws(() => parseWarnerStudio(deceptive), /missing/);
});
test('dispatch only accepts declared source IDs; failures return no update', () => {
  for (const [i, fixture] of [cruise, hero, warner].entries()) assert.equal(parseExperienceSource(EXPERIENCE_SOURCES[i], fixture).experienceId, EXPERIENCE_SOURCES[i].experienceId);
  assert.throws(() => parseExperienceSource('untrusted-adapter', warner), /Unsupported/);
  assert.throws(() => parseExperienceSource(EXPERIENCE_SOURCES[0], '<h1>Access denied 403</h1>'), /missing or invalid/);
});
