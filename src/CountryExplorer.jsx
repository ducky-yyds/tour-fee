import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, Clock3, MapPin, Plus, Search, X } from 'lucide-react';
import FlatWorldMap from './FlatWorldMap.jsx';
import { CountryFlag } from './DestinationSelect.jsx';
import { Photo } from './ui.jsx';
import { useLocale } from './locale.jsx';
import { CONTINENTS, cityInitial, compareCities, countryOptions, destinationName, matchesDestination } from './destination-utils.mjs';
import { getTripDuration } from '../shared/trip-duration.mjs';
import './country-explorer.css';

const continentEnglish = { 亚洲: 'Asia', 欧洲: 'Europe', 非洲: 'Africa', 北美洲: 'N. America', 南美洲: 'S. America', 大洋洲: 'Oceania', 南极洲: 'Antarctica' };
const regionNames = { HK: ['中国香港', 'Hong Kong'], MO: ['中国澳门', 'Macao'] };

export default function CountryExplorer({ cities, countries, selectedCountryCode, onSelectCountry, onOpenCity, onAddCity, budgetLabel, mapError, onRetry }) {
  const { locale } = useLocale();
  const en = locale === 'en';
  const [query, setQuery] = useState('');
  const [continent, setContinent] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [initial, setInitial] = useState('');
  const [addingId, setAddingId] = useState('');
  const citiesRef = useRef(null);
  const addingRef = useRef(false);
  const destinations = useMemo(() => countryOptions(cities, locale).map(country => ({
    ...country,
    ...(regionNames[country.countryCode] ? { name: regionNames[country.countryCode][0], nameEn: regionNames[country.countryCode][1] } : {}),
    cities: [...country.cities].sort((a, b) => compareCities(a, b, locale)),
  })), [cities, locale]);
  const selected = destinations.find(country => country.countryCode === selectedCountryCode) || destinations[0];
  const availableContinents = CONTINENTS.filter(region => destinations.some(country => country.region === region));
  const visibleCountries = destinations.filter(country => (!continent || continent === country.region) &&
    (matchesDestination(country, query) || country.cities.some(city => matchesDestination(city, query))));
  const countryCities = selected?.cities || [];
  const letters = [...new Set(countryCities.map(city => cityInitial(city, locale)))];
  const visibleCities = countryCities.filter(city => (!initial || cityInitial(city, locale) === initial) && matchesDestination(city, cityQuery));

  useEffect(() => { setCityQuery(''); setInitial(''); }, [selected?.countryCode, locale]);

  function showCities() {
    citiesRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }
  function selectCountry(code) {
    setCityQuery('');
    setInitial('');
    onSelectCountry(code);
    if (window.matchMedia('(max-width: 800px)').matches) requestAnimationFrame(showCities);
  }
  async function addCity(id) {
    if (addingRef.current) return;
    addingRef.current = true;
    setAddingId(id);
    try { await onAddCity?.(id); }
    finally { addingRef.current = false; setAddingId(''); }
  }

  return <section className="ce-explorer" aria-label={en ? 'Explore countries and cities' : '按国家探索城市'} data-testid="country-explorer">
    <div className="ce-atlas">
      <div className="ce-map-panel">
        <div className="ce-map-heading">
          <div><span className="ce-kicker">A WORLD OF POSSIBILITIES</span><h2>{en ? 'Where will curiosity take you?' : '从一个国家，展开下一段旅程'}</h2></div>
          <span className="ce-map-key"><i />{en ? 'Destinations to explore' : '已有城市资料'}</span>
        </div>
        <FlatWorldMap countries={countries} destinations={destinations} selectedCountryCode={selected?.countryCode || ''} onSelectCountry={code => { setQuery(''); setContinent(''); selectCountry(code); }} mapError={mapError} onRetry={onRetry} locale={locale} />
        <div className="ce-map-footer"><span><MapPin size={15} />{en ? 'Select a country on the map or in the list' : '点击地图或列表中的国家与地区'}</span>{selected && <button type="button" onClick={showCities}>{destinationName(selected, locale)}<ArrowDown size={14} /></button>}</div>
      </div>
      <aside className="ce-country-panel" aria-label={en ? 'Browse countries and regions' : '浏览国家与地区'}>
        <div className="ce-country-heading"><h3>{en ? 'Find your next stop' : '寻找下一站'}</h3><span>{en ? 'COUNTRIES & REGIONS' : '国家与地区'}</span></div>
        <label className="ce-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={en ? 'Country or city name' : '国家、城市或拼音'} aria-label={en ? 'Search countries and cities' : '搜索国家与城市'} />{Boolean(query) && <button type="button" onClick={() => setQuery('')} aria-label={en ? 'Clear search' : '清空搜索'}><X size={15} /></button>}</label>
        <div className="ce-continents" aria-label={en ? 'Filter by continent' : '按大洲筛选'}>
          {['', ...availableContinents].map(region => <button key={region} type="button" aria-pressed={continent === region} onClick={() => setContinent(region)}>{region ? (en ? continentEnglish[region] : region) : (en ? 'All' : '全部')}</button>)}
        </div>
        <div className="ce-countries" data-testid="country-list">
          {visibleCountries.map(country => <button type="button" key={country.countryCode} data-country-code={country.countryCode} aria-pressed={selected?.countryCode === country.countryCode} onClick={() => selectCountry(country.countryCode)}>
            <CountryFlag code={country.countryCode} /><span>{destinationName(country, locale)}</span>{selected?.countryCode === country.countryCode && <Check size={13} />}
          </button>)}
          {!visibleCountries.length && <p className="ce-empty">{en ? 'No matches. Try another name or continent.' : '暂未找到，试试其他名称或大洲。'}</p>}
        </div>
      </aside>
    </div>
    <section className="ce-destinations" ref={citiesRef} aria-labelledby="ce-country-title" data-testid="country-cities" data-country-code={selected?.countryCode || ''}>
      <div className="ce-destination-heading">
        <div className="ce-country-title"><CountryFlag code={selected?.countryCode} /><div><span className="ce-kicker">EXPLORE A LITTLE FURTHER</span><h2 id="ce-country-title">{selected ? destinationName(selected, locale) : (en ? 'Choose a country' : '选择一个国家')}</h2></div></div>
        <p aria-live="polite">{en ? `${countryCities.length} cities to discover · A–Z` : `${countryCities.length} 个可选城市 · 按拼音排列`}</p>
      </div>
      <div className="ce-city-tools">
        <label className="ce-search"><Search size={17} /><input value={cityQuery} onChange={event => { setCityQuery(event.target.value); setInitial(''); }} placeholder={en ? 'Find a city in this country' : '在这个国家里找城市'} aria-label={en ? 'Search cities in selected country' : '搜索当前国家的城市'} />{Boolean(cityQuery) && <button type="button" onClick={() => setCityQuery('')} aria-label={en ? 'Clear city search' : '清空城市搜索'}><X size={15} /></button>}</label>
        <div className="ce-letters" aria-label={en ? 'City initial' : '城市拼音首字母'}>{['', ...letters].map(letter => <button type="button" key={letter} onClick={() => setInitial(letter)} aria-pressed={initial === letter}>{letter || (en ? 'All' : '全部')}</button>)}</div>
      </div>
      <div className="ce-city-grid" data-testid="country-city-grid">
        {visibleCities.map(city => {
          const duration = getTripDuration(city);
          return <article className="ce-city-card" key={city.id} data-city-id={city.id}>
            <button className="ce-city-cover" type="button" onClick={() => onOpenCity(city.id)} aria-label={en ? `Explore ${destinationName(city, locale)}` : `探索${city.name}`}>
              <Photo image={city.image} alt={destinationName(city, locale)} /><span className="ce-cover-arrow"><ArrowUpRight size={19} /></span>
            </button>
            <div className="ce-city-body">
              <span className="ce-city-subtitle">{en ? (city.subdivisionEn || '') : (city.nameEn || '')}</span>
              <h3><button type="button" onClick={() => onOpenCity(city.id)}>{destinationName(city, locale)}</button></h3>
              <span className="ce-city-duration"><Clock3 size={14} />{en ? `${duration.min}–${duration.max} days recommended` : `建议游玩 ${duration.min}–${duration.max} 天`}</span>
              <div className="ce-city-budget"><span>{en ? 'Daily essentials' : '每日食宿与市内开销'}</span><strong>{budgetLabel(city)}<small> / {en ? 'day' : '天'}</small></strong></div>
              <div className="ce-city-actions"><button type="button" onClick={() => onOpenCity(city.id)}>{en ? 'Explore city' : '探索城市'}<ArrowUpRight size={14} /></button><button type="button" disabled={Boolean(addingId)} onClick={() => addCity(city.id)} aria-label={en ? `Add ${destinationName(city, locale)} to current trip` : `将${city.name}加入当前旅行`}><Plus size={14} />{addingId === city.id ? (en ? 'Adding…' : '添加中…') : (en ? 'Add to trip' : '加入旅行')}</button></div>
            </div>
          </article>;
        })}
      </div>
      {!visibleCities.length && <div className="ce-empty ce-empty-cities"><MapPin size={24} /><p>{countryCities.length ? (en ? 'No cities match these filters.' : '没有符合当前筛选的城市。') : (en ? 'No cities are available yet.' : '暂无可选城市。')}</p>{countryCities.length > 0 && <button type="button" onClick={() => { setCityQuery(''); setInitial(''); }}>{en ? 'Show all cities' : '显示全部城市'}</button>}</div>}
      <p className="ce-budget-note">{en ? 'Daily estimates cover one adult’s food, local transport and incidentals, plus one private room, from budget to comfort. Intercity travel and admission tickets are extra.' : '每日预算为经济至舒适档估算：含一间住宿、一位成人的餐饮、市内交通与杂项；城际交通和门票另计。'}</p>
    </section>
  </section>;
}
