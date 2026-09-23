const ART_SOURCE = 'https://github.com/ducky-yyds/tour-fee/blob/main/docs/generated-media.md';

/** A visible illustration is preferable to an unrelated hotel/place photograph. */
export function illustrationFor(entity, kind = 'place') {
  const theme = ['food', 'restaurant'].includes(kind) ? 'food'
    : kind === 'hotel' ? 'stay'
      : entity?.activityType === 'leisure' ? 'nature'
        : /博物馆|文化|艺术|历史/.test(entity?.category || '') ? 'culture' : 'walk';
  return {
    url: `/images/illustration-${theme}.png`,
    alt: `${entity?.name || '旅行'} · 主题插画`,
    scope: 'illustration',
    contextNote: 'AI 绘制的主题插画，用于表达活动或住宿氛围；不是该地点、房间或食物的实拍与外观承诺。',
    credit: '途算 · AI 主题插画',
    sourceUrl: ART_SOURCE,
    license: 'AI-generated project artwork',
    licenseUrl: ART_SOURCE,
  };
}

export function cardImage(entity, media, kind = 'place') {
  const image = media?.attractions?.[entity.id];
  if (kind === 'food' && entity.photoStatus === 'needs-food-photo' && !entity.photoFile && image?.scope !== 'illustration' && !image?.subjectMatched) return illustrationFor(entity, kind);
  if (image?.url) return image;
  if (entity.image?.url) return entity.image;
  if (entity.imageRef && media?.attractions?.[entity.imageRef]?.url) {
    const referenced = media.attractions[entity.imageRef];
    if (referenced.scope === 'illustration' || media.nearbyExcludedFiles?.includes(referenced.fileTitle?.replaceAll('_', ' '))) return illustrationFor(entity, kind);
    return { ...referenced, scope: 'nearby', contextNote: '与本项目相关的地点实景，非房间、套餐或供应商设施的实拍承诺。' };
  }
  return illustrationFor(entity, kind);
}
