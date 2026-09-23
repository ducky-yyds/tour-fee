import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Plane, Globe2, MapPin, Info } from 'lucide-react';
import { OutLink } from './ui.jsx';
import { apiFetch } from './api.mjs';
import './airport-cities.css';

const TYPES = { large_airport: '大型机场', medium_airport: '中型机场', small_airport: '小型机场', seaplane_base: '水上飞机基地' };
export default function AirportCityHome({ city, onBack, onAdd }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError(false);
    apiFetch(`/api/airports?cityId=${encodeURIComponent(city.id)}&limit=100`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(setResult)
      .catch(e => { if (e.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [city.id]);
  return <main className="airport-city-page page-width">
    <button className="text-button" onClick={onBack}><ArrowLeft size={16} /> 返回环球探索</button>
    <section className="airport-city-hero">
      <div><span className="eyebrow">A NEW POINT ON YOUR MAP</span><h1>{city.name}</h1><p>{city.nameEn !== city.name ? `${city.nameEn} · ` : ''}{city.country}{city.subdivision ? ` · ${city.subdivision}` : ''}</p><div className="airport-city-tags"><span><Plane size={15}/>机场资料已收录</span><span><MapPin size={15}/>{city.airportCount || city.airportIds?.length || 1} 处机场设施</span></div><button className="primary-button" onClick={onAdd}>加入我的旅行路线 <ArrowRight size={17}/></button></div>
      <div className="airport-geographic" aria-label="地理位置示意"><Globe2 size={128} strokeWidth={0.7}/><span>{Math.abs(city.lat).toFixed(2)}° {city.lat >= 0 ? 'N' : 'S'} · {Math.abs(city.lng).toFixed(2)}° {city.lng >= 0 ? 'E' : 'W'}</span><small>机场位置参考 · 非城市照片</small></div>
    </section>
    <div className="airport-coverage-note"><Info size={19}/><p>这里已收录机场位置与交通规划入口。景点、酒店和当地食宿价格仍待整理；加入路线后可自行添加景点与预算，系统会保留待补充提示。具体交通方式、班次与可订座位请向运营方确认。</p></div>
    <section className="airport-directory"><div className="content-heading"><div><h2>从机场，认识这一站</h2><p>具体出发日期、机场接驳与航班状态，请在预订前核对。</p></div></div>
      {!result && <p role="status">{error ? '机场详情读取失败，请刷新后重试。' : '正在读取机场资料…'}</p>}
      <div className="airport-list">{result?.airports?.map(airport => <article className="panel" key={airport.id}><div className="airport-code">{airport.iata || airport.icao || airport.ident}</div><div><h3>{airport.name}</h3><p>{TYPES[airport.type] || airport.type}</p><div className="airport-links"><OutLink href={`https://www.google.com/travel/flights?q=${encodeURIComponent(`Flights to ${airport.iata || airport.name}`)}`}>查询机票</OutLink>{airport.homeUrl && /^https?:\/\//.test(airport.homeUrl) && <OutLink href={airport.homeUrl}>机场官网</OutLink>}<OutLink href={airport.sourceUrl || city.sourceUrl}>查看资料来源</OutLink></div></div></article>)}</div>
      {result?.hasMore && <p className="small muted">当前展示前 100 处设施；完整数据保留在机场名录中。</p>}
    </section>
    <p className="small muted">资料来源：<OutLink href={city.sourceUrl || 'https://ourairports.com/data/'}>OurAirports 公开机场名录</OutLink> · 最近采集 {(city.sourceCheckedAt || result?.generatedAt)?.slice(0,10) || '见数据状态'}。坐标代表服务该地点的机场位置。</p>
  </main>;
}
