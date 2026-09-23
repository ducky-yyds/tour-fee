import React, { useMemo, useState } from 'react';
import { Search, Globe2, ArrowDownAZ, MapPin } from 'lucide-react';
import { CountrySelect, CountryFlag } from './DestinationSelect.jsx';
import { CONTINENTS, cityInitial, compareCities, countryOptions, getContinent, foldSearch } from './destination-utils.mjs';
import { convert } from './ui.jsx';
import './destination-gallery.css';

export default function DestinationGallery({ cities, currency, rates, renderCity }) {
  const [continent, setContinent] = useState('all');
  const [country, setCountry] = useState('all');
  const [mode, setMode] = useState('country');
  const [query, setQuery] = useState('');
  const [letter, setLetter] = useState('all');
  const [sort, setSort] = useState('name');
  const scoped = useMemo(() => cities.filter(city => continent === 'all' || getContinent(city) === continent), [cities, continent]);
  const countries = useMemo(() => countryOptions(scoped), [scoped]);
  const matches = useMemo(() => {
    const term = foldSearch(query).trim();
    const cost = city => convert(city.daily.lodging[0] / 2 + city.daily.food[0] + city.daily.transport[0] + city.daily.misc[0], city.currency, currency, rates);
    return scoped.filter(city => (country === 'all' || city.countryCode === country) && (!term || foldSearch([city.name, city.nameEn, city.country, city.subdivision, ...(city.tags || []), ...(city.searchAliases || [])].join(' ')).includes(term)))
      .sort((a, b) => sort === 'low' ? cost(a) - cost(b) || compareCities(a, b) : sort === 'high' ? cost(b) - cost(a) || compareCities(a, b) : compareCities(a, b));
  }, [scoped, country, query, sort, currency, rates]);
  const letters = useMemo(() => [...new Set(matches.map(cityInitial))].sort(), [matches]);
  const visible = matches.filter(city => letter === 'all' || cityInitial(city) === letter);
  const groups = new Map();
  for (const city of visible) {
    const key = mode === 'alphabet' ? cityInitial(city) : `${getContinent(city)}:${city.countryCode}`;
    if (!groups.has(key)) groups.set(key, { key, country: city.country, code: city.countryCode, continent: getContinent(city), cities: [] });
    groups.get(key).cities.push(city);
  }
  const grouped = [...groups.values()].sort((a, b) => mode === 'alphabet' ? a.key.localeCompare(b.key) : CONTINENTS.indexOf(a.continent) - CONTINENTS.indexOf(b.continent) || a.country.localeCompare(b.country, 'zh-CN'));
  return <section className="destination-gallery" aria-label="按大洲、国家和城市探索">
    <div className="dg-controls">
      <div className="dg-continents" role="group" aria-label="探索大洲">
        {['all', ...CONTINENTS].map(value => <button type="button" key={value} aria-pressed={continent === value} onClick={() => { setContinent(value); setCountry('all'); setLetter('all'); }}>{value === 'all' ? <><Globe2 size={15} />整个世界</> : value}</button>)}
      </div>
      <div className="dg-toolbar">
        <div className="dg-modes" role="group" aria-label="城市浏览方式">
          <button type="button" aria-pressed={mode === 'country'} onClick={() => { setMode('country'); setLetter('all'); }}><MapPin size={15} />先选国家</button>
          <button type="button" aria-pressed={mode === 'alphabet'} onClick={() => { setMode('alphabet'); setSort('name'); setLetter('all'); }}><ArrowDownAZ size={15} />城市 A–Z</button>
        </div>
        <CountrySelect countries={countries} value={country} onChange={value => { setCountry(value); setLetter('all'); }} label="筛选国家或地区" allowAll allValue="all" />
        <label className="search-box dg-search"><Search size={17} /><input type="search" aria-label="搜索目的地" placeholder="城市、国家或旅行特色" value={query} onChange={event => { setQuery(event.target.value); setLetter('all'); }} /></label>
        <select className="city-sort" aria-label="城市排序" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="name">英文名 / 罗马字 A–Z</option><option value="low">组内日常成本从低到高</option><option value="high">组内日常成本从高到低</option>
        </select>
      </div>
      <div className="dg-alphabet" role="group" aria-label="按城市首字母筛选">
        <button type="button" aria-pressed={letter === 'all'} onClick={() => setLetter('all')}>全部</button>
        {letters.map(value => <button type="button" key={value} aria-pressed={letter === value} onClick={() => setLetter(value)}>{value}</button>)}
        <small>英文名 / 罗马字首字母</small>
      </div>
    </div>
    {grouped.map(group => <section className="dg-group" key={group.key}>
      <header className="dg-heading">{mode === 'alphabet' ? <><span className="dg-initial">{group.key}</span><h2>以 {group.key} 开始的目的地</h2></> : <><CountryFlag code={group.code} /><div><small>{group.continent}</small><h2>{group.country}</h2></div></>}</header>
      <div className="explore-grid">{group.cities.map(renderCity)}</div>
    </section>)}
    {!visible.length && <div className="empty-state"><MapPin /><p>没有找到匹配的城市</p><small>试试其他国家、首字母或关键词。</small></div>}
  </section>;
}
