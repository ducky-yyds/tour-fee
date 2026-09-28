import React, { useEffect, useMemo, useState } from 'react';
import { Search, Globe2, ArrowDownAZ, MapPin } from 'lucide-react';
import { CountrySelect } from './DestinationSelect.jsx';
import { CONTINENTS, cityInitial, compareCities, countryOptions, getContinent, matchesDestination } from './destination-utils.mjs';
import { useLocale } from './locale.jsx';
import { convert } from './ui.jsx';
import './destination-gallery.css';

export default function DestinationGallery({ cities, currency, rates, renderCity }) {
  const { locale } = useLocale();
  const [continent, setContinent] = useState('all');
  const [country, setCountry] = useState('all');
  const [mode, setMode] = useState('alphabet');
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('all');
  const [sort, setSort] = useState('name');
  const scoped = useMemo(() => cities.filter(city => continent === 'all' || getContinent(city) === continent), [cities, continent]);
  const countries = useMemo(() => countryOptions(scoped, locale), [scoped, locale]);
  const matches = useMemo(() => {
    const cost = city => convert(city.daily.lodging[0] / 2 + city.daily.food[0] + city.daily.transport[0] + city.daily.misc[0], city.currency, currency, rates);
    return scoped.filter(city => (country === 'all' || city.countryCode === country) && matchesDestination(city, query))
      .sort((a, b) => sort === 'low' ? cost(a) - cost(b) || compareCities(a, b, locale) : sort === 'high' ? cost(b) - cost(a) || compareCities(a, b, locale) : compareCities(a, b, locale));
  }, [scoped, country, query, sort, currency, rates, locale]);
  const letters = useMemo(() => [...new Set(matches.map(city => cityInitial(city, locale)))].sort(), [matches, locale]);
  const visible = matches.filter(city => letter === 'all' || cityInitial(city, locale) === letter);
  useEffect(() => setLetter('all'), [locale]);
  return <section className="destination-gallery" aria-label="按大洲、国家和城市探索">
    <div className="dg-controls">
      <div className="dg-continents" role="group" aria-label="探索大洲">
        {['all', ...CONTINENTS].map(value => <button type="button" key={value} aria-pressed={continent === value} onClick={() => { setContinent(value); setCountry('all'); setLetter('all'); }}>{value === 'all' ? <><Globe2 size={15} />整个世界</> : value}</button>)}
      </div>
      <div className="dg-toolbar">
        <div className="dg-modes" role="group" aria-label="城市浏览方式">
          <button type="button" aria-pressed={mode === 'alphabet'} onClick={() => { setMode('alphabet'); setCountry('all'); setSort('name'); setLetter('all'); }}><ArrowDownAZ size={15} />城市 A–Z</button>
          <button type="button" aria-pressed={mode === 'country'} onClick={() => { setMode('country'); setLetter('all'); }}><MapPin size={15} />先选国家</button>
        </div>
        {mode === 'country' && <CountrySelect countries={countries} value={country} onChange={value => { setCountry(value); setLetter('all'); }} label="筛选国家或地区" allowAll allValue="all" />}
        <label className="search-box dg-search"><Search size={17} /><input type="search" aria-label="搜索目的地" placeholder={locale === 'en' ? 'City, country or travel style' : '城市、国家、拼音或旅行特色'} value={query} onChange={event => { setQuery(event.target.value); setLetter('all'); }} /></label>
        <select className="city-sort" aria-label="城市排序" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="name">{locale === 'en' ? 'English name A–Z' : '中文拼音 A–Z'}</option><option value="low">日常成本从低到高</option><option value="high">日常成本从高到低</option>
        </select>
      </div>
      <div className="dg-alphabet" role="group" aria-label="按城市首字母筛选">
        <button type="button" aria-pressed={letter === 'all'} onClick={() => setLetter('all')}>全部</button>
        {letters.map(value => <button type="button" key={value} aria-pressed={letter === value} onClick={() => setLetter(value)}>{value}</button>)}
        <small>{locale === 'en' ? 'English name initials' : '中文名拼音首字母'}</small>
      </div>
    </div>
    <div className="explore-grid dg-city-grid">{visible.map(renderCity)}</div>
    {!visible.length && <div className="empty-state"><MapPin /><p>没有找到匹配的城市</p><small>试试其他国家、首字母或关键词。</small></div>}
  </section>;
}
