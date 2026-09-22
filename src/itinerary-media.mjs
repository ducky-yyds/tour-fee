import manifest from '../data/routine-media.json' with { type: 'json' };

/** Photo-compatible image objects. Their root-relative URLs go through Photo/assetUrl. */
const images = Object.fromEntries(Object.entries(manifest.images).map(([kind, image]) => [kind, {
  ...image, creditOriginal: image.credit,
  credit: ({ breakfast: 'Pixel.la', boat: 'Mertie' })[kind] || image.credit,
}]));
export const ROUTINE_MEDIA = Object.freeze({ ...images, road: { ...images.transfer, alt: '公路客运巴士场景' } });

function scene(kind) {
  const image = ROUTINE_MEDIA[kind];
  return image ? { image, alt: `${image.alt} · 场景参考图`, label: '场景参考图', isReference: true, kind } : null;
}

function localScene(item, city) {
  const targetId = item.segment?.toId || item.toId;
  const target = item.suggestedPlaces?.find(place => place.image?.url && place.image.url !== city?.image?.url)
    || city?.attractions?.find(place => place.id === targetId);
  // A nearby landmark illustrates the area; it is not a verified street-level route.
  const targetImage = target?.image?.url && target.image.url !== city?.image?.url ? target.image : null;
  const image = targetImage || city?.image || item.image;
  if (!image?.url) return null;
  const label = targetImage ? '周边景点参考图' : '城市参考图';
  return { image, alt: `${targetImage ? target.name : city?.name || image.alt || '目的地'} · ${label}`, label, isReference: true, kind: 'walk' };
}

function venueScene(item, city) {
  const venue = city?.experiences?.find(entry => entry.id === item.experienceId);
  const image = venue?.image || item.image;
  // Existing experience imageRef values can refer to nearby landmarks. A photo
  // only becomes a venue image when its metadata explicitly identifies that venue.
  if (!venue || !image?.url || image.isReference || ![image.subjectId, image.experienceId, image.entityId].includes(venue.id)) return null;
  return { image, alt: `${venue.name} · 地点资料图`, label: '地点资料图', isReference: false, kind: item.kind };
}

/**
 * Scene selection only; never changes costs, route estimates, or reservations.
 * Generic photographs must retain the returned reference label in the UI.
 * Returned image metadata contains author/source/license for a visible credit link.
 */
export function getItineraryMedia(item, city) {
  if (!item) return null;
  if (item.routineType === 'arrival-ready' || item.journeyPhase === 'arrived') {
    const media = localScene({}, city);
    return media ? { ...media, kind: 'arrival' } : null;
  }
  if (item.kind === 'meal') return venueScene(item, city) || scene(item.mealType === 'breakfast' ? 'breakfast' : 'meal');
  if (item.kind === 'hotel' || item.kind === 'lodging' || item.kind === 'checkin') return venueScene(item, city) || scene('hotel');
  if (item.kind === 'journey-transfer' || item.kind === 'transfer') return scene('transfer');
  const mode = item.transportMode || item.segment?.mode || item.mode;
  if (item.routineType === 'citywalk' || item.kind === 'free' || item.kind === 'walk' || mode === 'walk') return localScene(item, city);
  if (['arrival', 'departure', 'transport', 'transfer', 'journey'].includes(item.kind)) {
    if (item.kind === 'departure' && !item.journey && /退房|整理行李/.test(item.title || '')) return scene('hotel');
    const aliases = { air: 'air', flight: 'air', plane: 'air', rail: 'rail', train: 'rail', boat: 'boat', ferry: 'boat', ship: 'boat', road: 'road', car: 'road', bus: 'road', transit: 'transfer', transfer: 'transfer' };
    if (aliases[mode]) return scene(aliases[mode]);
    // An unclassified arrival/departure must not imply that an actual flight exists.
    return scene('transfer');
  }
  if (item.image?.url) {
    const reference = item.image.isReference || item.image.url === city?.image?.url;
    return { image: item.image, alt: item.title || item.image.alt || '景点', label: reference ? '城市参考图' : '景点资料图', isReference: Boolean(reference), kind: item.kind };
  }
  return null;
}
