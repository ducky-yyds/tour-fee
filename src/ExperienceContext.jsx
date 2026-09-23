import React from 'react';
import { CalendarDays, Fish, Sparkles, Mountain } from 'lucide-react';
import { seasonLabel } from '../shared/experience-discovery.mjs';

export default function ExperienceContext({ item }) {
  if (!item.localContext && !item.seasonality && !item.wildlife && !item.natureHighlights?.length) return null;
  return <div className="ch-experience-context">
    {item.localContext && <div><Sparkles size={17} /><section><strong>为什么值得体验</strong><p>{item.localContext}</p></section></div>}
    {item.seasonality && <div><CalendarDays size={17} /><section><strong>{seasonLabel(item)}</strong><p>{item.seasonality.note || '实际活动日期、天气与名额以官网为准。'}</p></section></div>}
    {item.wildlife && <div><Fish size={17} /><section><strong>{item.wildlife.species?.length ? item.wildlife.species.join(' · ') : '自然观察'}</strong><p>{item.wildlife.encounterNote}</p>{item.wildlife.responsibleNote && <p>{item.wildlife.responsibleNote}</p>}</section></div>}
    {!!item.natureHighlights?.length && <div><Mountain size={17} /><section><strong>风景看点</strong><p>{item.natureHighlights.join(' · ')}</p></section></div>}
  </div>;
}
