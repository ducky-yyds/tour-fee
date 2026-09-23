import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, ChevronRight, Globe2, MapPin, Search, X } from 'lucide-react';
import { assetUrl } from './api.mjs';
import { isTravelDestination } from '../shared/airport-catalog.mjs';
import flagCodes from './flag-codes.json';
import { CONTINENTS, cityInitial, compareCities, countryNameEn, countryOptions, foldSearch, getContinent, groupedInitials } from './destination-utils.mjs';
import './destination-select.css';

const EMPTY = Object.freeze([]);
const FLAGS = new Set(flagCodes);

export function CountryFlag({ code, className = '' }) {
  const normalized = String(code || '').toUpperCase();
  return FLAGS.has(normalized) ? <img className={`country-flag ${className}`} src={assetUrl(`/flags/${normalized.toLowerCase()}.svg`)} alt="" aria-hidden="true" width="24" height="18" loading="lazy" /> : <Globe2 className={`country-flag country-flag-fallback ${className}`} size={22} aria-hidden="true" />;
}

/** A non-modal top-layer panel: works inside the project dialog without nesting dialogs. */
export function SelectPopover({ label, children, selection, disabled = false, className = '', compact = false, panelClassName = '' }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null), panel = useRef(null);
  const id = useId(), labelId = `${id}-label`;
  const close = (restoreFocus = false) => { setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  useEffect(() => {
    if (!open || !panel.current) return;
    const element = panel.current;
    const position = () => {
      const anchor = trigger.current?.getBoundingClientRect();
      if (!anchor) return;
      const viewportWidth = window.visualViewport?.width || window.innerWidth;
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const width = Math.min(compact ? 360 : 660, viewportWidth - 24);
      const below = viewportHeight - anchor.bottom - 16;
      const above = anchor.top - 16;
      const placeAbove = below < Math.min(300, above) && above > below;
      const maxHeight = Math.min(600, Math.max(160, placeAbove ? above : below), viewportHeight - 32);
      const top = placeAbove ? Math.max(12, anchor.top - maxHeight - 8) : Math.max(12, Math.min(anchor.bottom + 8, viewportHeight - maxHeight - 12));
      Object.assign(element.style, { width: `${width}px`, left: `${Math.max(12, Math.min(anchor.left, viewportWidth - width - 12))}px`, top: `${top}px`, maxHeight: `${maxHeight}px` });
    };
    position();
    if (element.showPopover && !element.matches(':popover-open')) element.showPopover();
    (element.querySelector('input') || element.querySelector('button'))?.focus();
    const onOutside = event => { if (!element.contains(event.target) && !trigger.current?.contains(event.target)) close(); };
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
      if (event.key === 'Tab') setTimeout(() => { if (!element.contains(document.activeElement) && !trigger.current?.contains(document.activeElement)) close(); }, 0);
    };
    const onToggle = event => { if (event.newState === 'closed') setOpen(false); };
    document.addEventListener('pointerdown', onOutside, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    window.visualViewport?.addEventListener('resize', position);
    element.addEventListener('toggle', onToggle);
    return () => {
      document.removeEventListener('pointerdown', onOutside, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      window.visualViewport?.removeEventListener('resize', position);
      element.removeEventListener('toggle', onToggle);
      if (element.hidePopover && element.matches(':popover-open')) element.hidePopover();
    };
  }, [open, compact]);
  return <div className={`destination-select ${compact ? 'destination-select-compact' : ''} ${className}`}>
    {label && <span className="destination-select-label" id={labelId}>{label}</span>}
    <button type="button" className="destination-select-trigger" ref={trigger} aria-labelledby={label ? labelId : undefined} aria-label={!label ? '选择目的地' : undefined} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} disabled={disabled} onClick={() => setOpen(current => !current)}>
      <span className="destination-selected">{selection}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div ref={panel} id={id} popover="manual" role="dialog" aria-label={label || '选择目的地'} className={`destination-popover ${panelClassName}`}>
      <div className="destination-popover-heading"><span>{label || '选择目的地'}</span><button type="button" className="destination-close" aria-label="关闭选择列表" onClick={() => close(true)}><X size={17} /></button></div>
      {children(() => close(true))}
    </div>}
  </div>;
}

function Continents({ value, onChange, available }) {
  return <div className="destination-continents" role="group" aria-label="按大洲浏览">
    {['全部', ...CONTINENTS.filter(region => available.includes(region)), ...(available.includes('其他地区') ? ['其他地区'] : [])].map(region => <button type="button" key={region} aria-pressed={value === region} onClick={() => onChange(region)}>{region === '全部' && <Globe2 size={14} />}{region}</button>)}
  </div>;
}

function LetterIndex({ letters, selected, onSelect }) {
  return <div className="destination-letters" role="group" aria-label="英文名首字母"><button type="button" aria-pressed={!selected} onClick={() => onSelect('')}>全部</button>{letters.map(letter => <button type="button" key={letter} aria-pressed={selected === letter} onClick={() => onSelect(letter)}>{letter}</button>)}</div>;
}

export function moveResultFocus(event) {
  const input = event.target.tagName === 'INPUT';
  if (event.key === 'Enter' && input) {
    event.preventDefault();
    event.currentTarget.querySelector('[data-destination-result]')?.click();
    return;
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  if (input && !['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  if (!input && !event.target.closest('[data-destination-result]')) return;
  const results = [...event.currentTarget.querySelectorAll('[data-destination-result]')];
  if (!results.length) return;
  const index = results.indexOf(event.target.closest('[data-destination-result]'));
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? results.length - 1 : index < 0 ? event.key === 'ArrowUp' ? results.length - 1 : 0 : Math.max(0, Math.min(results.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
  event.preventDefault(); results[next]?.focus();
}

function CityThumbnail({ city }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [city.image?.url]);
  return city.image?.url && !failed ? <img className="destination-city-photo" src={assetUrl(city.image.url)} alt="" loading="lazy" onError={() => setFailed(true)} /> : <span className="destination-city-photo destination-city-placeholder"><MapPin size={21} /></span>;
}

export function DestinationBrowser({ cities = EMPTY, onPick, exclude = EMPTY, value, compact = false, renderMeta, autoFocus = true }) {
  const [query, setQuery] = useState(''), [continent, setContinent] = useState('全部'), [country, setCountry] = useState('');
  const [mode, setMode] = useState('country'), [letter, setLetter] = useState(''), [limit, setLimit] = useState(48);
  const excluded = useMemo(() => new Set(exclude), [exclude]);
  const indexed = useMemo(() => cities.filter(city => isTravelDestination(city) && !excluded.has(city.id)).map(city => ({ city, text: foldSearch([city.name, city.nameEn, city.country, city.countryEn, city.countryCode, city.iata, city.subdivision, ...(city.airportCodes || []), ...(city.tags || [])].join(' ')) })), [cities, excluded]);
  const countries = useMemo(() => countryOptions(indexed.map(row => row.city)), [indexed]);
  const available = useMemo(() => [...new Set(countries.map(item => item.region))], [countries]);
  const selectedCountry = countries.find(item => item.countryCode === country);
  const browsingCountries = mode === 'country' && !country && !query.trim();
  const filtered = useMemo(() => {
    if (browsingCountries) return [];
    const term = foldSearch(query).trim();
    return indexed.filter(({ city, text }) => (continent === '全部' || getContinent(city) === continent) && (!country || city.countryCode === country) && (!term || text.includes(term))).map(row => row.city).sort(compareCities);
  }, [indexed, continent, country, query, browsingCountries]);
  const letters = useMemo(() => [...new Set(filtered.map(cityInitial))], [filtered]);
  const matches = useMemo(() => letter ? filtered.filter(city => cityInitial(city) === letter) : filtered, [filtered, letter]);
  const groups = useMemo(() => groupedInitials(matches.slice(0, limit)), [matches, limit]);
  useEffect(() => { setLimit(48); setLetter(''); }, [query, continent, country, mode]);
  useEffect(() => setLimit(48), [letter]);
  const chooseCountry = code => { setCountry(code); setMode('country'); setQuery(''); setLetter(''); };
  return <div className={`destination-browser ${compact ? 'destination-browser-compact' : ''}`} onKeyDown={moveResultFocus}>
    <div className="destination-search"><Search size={17} /><input aria-label="搜索城市或国家" placeholder="搜索城市或国家" value={query} autoFocus={autoFocus} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="清空搜索" onClick={() => setQuery('')}><X size={15} /></button>}</div>
    <Continents value={continent} available={available} onChange={region => { setContinent(region); setCountry(''); }} />
    <div className="destination-browse-tools"><div className="destination-view-switch" role="group" aria-label="目的地浏览方式"><button type="button" aria-pressed={mode === 'country'} onClick={() => setMode('country')}>先选国家</button><button type="button" aria-pressed={mode === 'alphabet'} onClick={() => { setMode('alphabet'); setCountry(''); }}>城市 A–Z</button></div></div>
    {country && <div className="destination-breadcrumb"><button type="button" onClick={() => { setCountry(''); setQuery(''); }}><ArrowLeft size={15} />国家 / 地区</button><ChevronRight size={13} /><CountryFlag code={country} /><strong>{selectedCountry?.name || country}</strong></div>}
    {browsingCountries ? <div className="destination-country-groups">{[...CONTINENTS, '其他地区'].filter(region => continent === '全部' || continent === region).map(region => {
      const rows = countries.filter(item => item.region === region);
      if (!rows.length) return null;
      return <section className="destination-country-group" key={region}><h4><Globe2 size={15} />{region}</h4><div className="destination-country-grid">{rows.map(item => <button type="button" key={item.countryCode} data-destination-result onClick={() => chooseCountry(item.countryCode)}><CountryFlag code={item.countryCode} /><span><strong>{item.name}</strong><small>{item.nameEn}</small></span><ChevronRight size={15} /></button>)}</div></section>;
    })}{!countries.length && <p className="destination-empty">暂无可选择的目的地。</p>}</div> : <>
      <div className="destination-order-note">按英文名 / 罗马字首字母排列</div><LetterIndex letters={letters} selected={letter} onSelect={setLetter} />
      <div className="destination-results">{groups.map(([initial, rows]) => <section key={initial} className="destination-letter-group"><h4>{initial}</h4><div className="destination-city-grid">{rows.map(city => <button key={city.id} type="button" className={`destination-city ${value === city.id ? 'is-selected' : ''}`} data-destination-result aria-pressed={value === city.id} onClick={() => onPick(city.id)}><CityThumbnail city={city} /><span className="destination-city-copy"><strong>{city.name}</strong>{city.nameEn !== city.name && <small>{city.nameEn}</small>}<span className="destination-city-country"><CountryFlag code={city.countryCode} />{city.country}{city.iata ? ` · ${city.iata}` : ''}</span>{renderMeta ? <span className="destination-city-meta">{renderMeta(city)}</span> : city.subdivision && <small className="destination-city-subdivision">{city.subdivision}</small>}</span>{value === city.id ? <Check size={17} /> : <ArrowUpRight size={16} />}</button>)}</div></section>)}</div>
      {matches.length > limit && <button type="button" className="destination-more" onClick={() => setLimit(current => current + 48)}>继续浏览<ChevronDown size={15} /></button>}
      {!matches.length && <p className="destination-empty"><MapPin size={22} />没有找到匹配的城市，试试其他名称或国家。</p>}
    </>}
  </div>;
}

export default function DestinationSelect({ cities = EMPTY, value, onChange, label = '选择城市', placeholder = '请选择城市', exclude = EMPTY, disabled = false, className = '' }) {
  const city = useMemo(() => cities.find(item => item.id === value), [cities, value]);
  return <SelectPopover label={label} disabled={disabled} className={className} selection={city ? <><CountryFlag code={city.countryCode} /><span><strong>{city.name}</strong><small>{city.country}</small></span></> : <><MapPin size={19} /><span>{placeholder}</span></>}>
    {close => <DestinationBrowser cities={cities} value={value} exclude={exclude} compact onPick={id => { onChange(id); close(); }} />}
  </SelectPopover>;
}

export function CountrySelect({ countries = EMPTY, value, onChange, label = '国家 / 地区', placeholder = '选择国家 / 地区', disabled = false, className = '', allowAll = false, allValue = 'all' }) {
  const [query, setQuery] = useState(''), [continent, setContinent] = useState('全部'), [letter, setLetter] = useState('');
  const normalized = useMemo(() => countries.map(country => ({ ...country, name: country.name || country.country, nameEn: country.nameEn || country.countryEn || countryNameEn(country.countryCode), region: getContinent(country) })), [countries]);
  const selected = normalized.find(country => country.countryCode === value);
  const available = [...new Set(normalized.map(country => country.region))];
  const filtered = normalized.filter(country => (continent === '全部' || country.region === continent) && foldSearch([country.name, country.nameEn, country.countryCode, ...(country.cities || []).flatMap(city => [city.name, city.nameEn])].join(' ')).includes(foldSearch(query).trim())).sort((a, b) => compareCities(a, b));
  const letters = [...new Set(filtered.map(cityInitial))];
  const groups = groupedInitials(filtered.filter(country => !letter || cityInitial(country) === letter));
  return <SelectPopover label={label} disabled={disabled} className={className} selection={selected ? <><CountryFlag code={value} /><span>{selected.name}</span></> : <><Globe2 size={19} /><span>{allowAll && value === allValue ? '全部国家 / 地区' : placeholder}</span></>}>
    {close => <div className="destination-browser" onKeyDown={moveResultFocus}><div className="destination-search"><Search size={17} /><input autoFocus aria-label="搜索国家或地区" placeholder="国家、地区或城市" value={query} onChange={event => { setQuery(event.target.value); setLetter(''); }} /></div><Continents value={continent} available={available} onChange={region => { setContinent(region); setLetter(''); }} /><div className="destination-order-note">国家英文名 A–Z</div><LetterIndex letters={letters} selected={letter} onSelect={setLetter} />{allowAll && <button type="button" className="destination-all-countries" data-destination-result onClick={() => { onChange(allValue); close(); }}><Globe2 size={18} />全部国家 / 地区{value === allValue && <Check size={16} />}</button>}{groups.map(([initial, rows]) => <section key={initial} className="destination-letter-group"><h4>{initial}</h4><div className="destination-country-grid">{rows.map(country => <button key={country.countryCode} type="button" data-destination-result aria-pressed={value === country.countryCode} onClick={() => { onChange(country.countryCode); close(); }}><CountryFlag code={country.countryCode} /><span><strong>{country.name}</strong><small>{country.nameEn}</small></span>{value === country.countryCode ? <Check size={16} /> : <ChevronRight size={14} />}</button>)}</div></section>)}{!filtered.length && <p className="destination-empty">没有找到匹配的国家或地区。</p>}</div>}
  </SelectPopover>;
}
