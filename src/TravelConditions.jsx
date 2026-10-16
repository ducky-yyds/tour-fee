import React from 'react';
import { Info, ExternalLink } from 'lucide-react';
import { useLocale } from './locale.jsx';
import './travel-conditions.css';

export default function TravelConditions({ advisory }) {
  const { locale } = useLocale();
  if (!advisory?.note || !/^https:\/\//.test(advisory.url || '')) return null;
  const en = locale === 'en';
  return <details className="travel-conditions">
    <summary><Info size={16} /><strong>{en ? 'Travel conditions' : '出行条件'}</strong><span>{en ? 'Check access and current advice before planning' : '规划前先了解开放、入境与当前旅行提示'}</span></summary>
    <div><p>{en ? advisory.noteEn || advisory.note : advisory.note}</p>
      <a href={advisory.url} target="_blank" rel="noreferrer">{en ? 'Read the source and its scope' : '查看来源及适用范围'}<ExternalLink size={13} /></a>
      {advisory.checkedAt && <small>{en ? 'Last reviewed: ' : '资料核对：'}{advisory.checkedAt.slice(0, 10)}</small>}
    </div>
  </details>;
}
