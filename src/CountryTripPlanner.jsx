import EditableNumberInput from "./EditableNumberInput.jsx";
import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Compass, MapPin, Plus, RotateCcw, Route, Sparkles, Trash2, TriangleAlert } from 'lucide-react';
import { buildCountryDraft, listCountryDestinations } from '../shared/country-planning.mjs';
import { Photo } from './ui.jsx';
import { CountrySelect } from './DestinationSelect.jsx';
import './country-trip-planner.css';

const duration = minutes => minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ''}`;
const defaultDate = () => new Date().toISOString().slice(0, 10);
const EMPTY = Object.freeze([]);

/** Embeddable in either a new-project modal or the add-destination panel. */
export default function CountryTripPlanner({
  cities = EMPTY, originId, departureDate, returnToOrigin = true, planContext,
  excludedCityIds = EMPTY, maxCities, initialCountryCode = 'JP', initialDays = 7,
  onApply, onCancel, applyLabel = '使用这份国家旅程',
}) {
  const countries = useMemo(() => listCountryDestinations(cities), [cities]);
  const [countryCode, setCountryCode] = useState(() => countries.some(country => country.countryCode === initialCountryCode) ? initialCountryCode : countries[0]?.countryCode || '');
  const [totalDays, setTotalDays] = useState(initialDays);
  const [date, setDate] = useState(departureDate || defaultDate());
  const [includeReturn, setIncludeReturn] = useState(returnToOrigin);
  const [cityIds, setCityIds] = useState(undefined);
  const [dayAllocations, setDayAllocations] = useState(undefined);
  const cityMap = useMemo(() => new Map(cities.map(city => [city.id, city])), [cities]);
  const { draft, error } = useMemo(() => {
    try {
      return { draft: buildCountryDraft({ cities, countryCode, totalDays, originId, departureDate: date, returnToOrigin: includeReturn, planContext, excludedCityIds, maxCities, cityIds, dayAllocations }), error: null };
    } catch (caught) { return { draft: null, error: caught.message }; }
  }, [cities, countryCode, totalDays, originId, date, includeReturn, planContext, excludedCityIds, maxCities, cityIds, dayAllocations]);
  const reset = () => { setCityIds(undefined); setDayAllocations(undefined); };
  const changeCountry = value => { setCountryCode(value); reset(); };
  const priorStops = planContext?.stops || [];
  const origin = cityMap.get(planContext?.originId || originId);
  const entryCity = cityMap.get(priorStops.at(-1)?.cityId) || origin;
  const capacity = Math.min(maxCities ?? 8, 8 - priorStops.length, Number(totalDays));
  const reorder = (index, direction) => {
    const ids = draft.stops.map(stop => stop.cityId), allocation = draft.stops.map(stop => stop.days);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    [allocation[index], allocation[index + direction]] = [allocation[index + direction], allocation[index]];
    setCityIds(ids); setDayAllocations(allocation);
  };
  const shiftDay = (index, direction) => {
    const allocation = draft.stops.map(stop => stop.days);
    const others = allocation.map((days, other) => ({ days, other })).filter(row => row.other !== index && (direction < 0 || row.days > 1)).sort((a, b) => b.days - a.days);
    if (!others.length || direction < 0 && allocation[index] <= 1) return;
    allocation[index] += direction; allocation[others[0].other] -= direction;
    setCityIds(draft.stops.map(stop => stop.cityId)); setDayAllocations(allocation);
  };
  const removeCity = index => { setCityIds(draft.stops.filter((_, i) => i !== index).map(stop => stop.cityId)); setDayAllocations(undefined); };
  return <section className="country-trip-planner" aria-label="按国家智能规划旅程">
    <header className="country-trip-intro">
      <span className="country-trip-kicker"><Compass size={17} /> 从一个国家，开始下一段旅程</span>
      <h3>想去哪里，留几天？</h3>
      <p>先挑适合的城市，再给交通和游览留出时间。你可以调整城市顺序与停留天数，景点会随之重新安排。</p>
    </header>
    <div className="country-trip-controls">
      <CountrySelect countries={countries} value={countryCode} onChange={changeCountry} label="目的国家 / 地区" disabled={!countries.length} />
      <label>本次总天数<EditableNumberInput aria-label="国家旅程总天数" type="number" min="1" max="365" value={totalDays} onChange={event => { setTotalDays(event.target.value === '' ? '' : Number(event.target.value)); reset(); }} /></label>
      {!planContext && <label>出发日期<input aria-label="国家旅程出发日期" type="date" value={date} onChange={event => setDate(event.target.value)} /></label>}
    </div>
    <div className="country-trip-origin"><Route size={17} /><span>{priorStops.length ? `接续 ${entryCity?.name || '上一站'}` : `从 ${origin?.name || '尚未选择的出发地'} 出发`}{draft && ` · ${draft.departureDate}`}</span>{!planContext ? <label><input type="checkbox" checked={includeReturn} onChange={event => setIncludeReturn(event.target.checked)} />预留返回出发地的交通</label> : <span>{planContext.returnTrip !== false ? `含最终返回${origin?.name || '原出发地'}的时间` : '沿用原行程的单程安排'}</span>}</div>
    {error && <p className="country-trip-error" role="alert"><TriangleAlert size={18} />{error}</p>}
    {draft && <>
      <div className="country-trip-metrics" aria-live="polite">
        <div><span><CalendarDays size={17} /> 总天数</span><strong>{draft.totalDays}<small>天，含交通日</small></strong></div>
        <div><span><MapPin size={17} /> 入选城市</span><strong>{draft.stops.length}<small>座</small></strong></div>
        <div><span><Clock3 size={17} /> 跨城与进出交通</span><strong>{duration(draft.summary.transportMinutes)}<small>模型预留</small></strong></div>
      </div>
      <div className="country-trip-route-heading"><div><h4>城市顺序与停留安排</h4><p>增减一天会在城市间调配，总天数保持 {draft.totalDays} 天。</p></div><button type="button" className="text-button" onClick={reset}><RotateCcw size={15} />重新智能挑选</button></div>
      <ol className="country-trip-route">
        {draft.summary.stops.map((stop, index) => {
          const city = cityMap.get(stop.cityId), inbound = draft.transportLegs.find(leg => leg.toStopIndex === index);
          return <li key={stop.cityId}>
            {inbound && <div className="country-trip-leg"><ArrowRight size={16} /><span>{inbound.fromName} → {inbound.toName}<small>{inbound.modeLabel} · {duration(inbound.estimatedMinutes)}</small></span></div>}
            <article className="country-trip-city">
              <Photo image={city.image} alt={city.name} className="country-trip-city-photo" />
              <div className="country-trip-city-copy"><span className="country-trip-days">第 {stop.startDay}{stop.endDay !== stop.startDay ? `–${stop.endDay}` : ''} 天 · {stop.date}</span><h4><span className="country-trip-order">{index + 1}</span>{stop.name}</h4><p>{stop.highlights.length ? stop.highlights.join(' · ') : '当前时间不足，尚未排入景点'}</p><small>{stop.selectedCount} 个入选景点 · {stop.deferredCount} 个候选{stop.travelOnlyDays > 0 ? ` · ${stop.travelOnlyDays} 天以交通和休息为主` : ''}</small></div>
              <div className="country-trip-city-actions"><div className="country-trip-day-stepper"><button type="button" aria-label={`减少${stop.name}一天`} disabled={draft.stops.length === 1 || stop.days <= 1} onClick={() => shiftDay(index, -1)}><ChevronLeft size={17} /></button><strong>{stop.days}<small>天</small></strong><button type="button" aria-label={`增加${stop.name}一天`} disabled={!draft.stops.some((row, i) => i !== index && row.days > 1)} onClick={() => shiftDay(index, 1)}><ChevronRight size={17} /></button></div><div className="country-trip-order-actions"><button type="button" aria-label={`将${stop.name}提前`} disabled={index === 0} onClick={() => reorder(index, -1)}><ArrowUp size={15} /></button><button type="button" aria-label={`将${stop.name}后移`} disabled={index === draft.stops.length - 1} onClick={() => reorder(index, 1)}><ArrowDown size={15} /></button><button type="button" aria-label={`移除${stop.name}并重分配天数`} disabled={draft.stops.length === 1} onClick={() => removeCity(index)}><Trash2 size={15} /></button></div></div>
            </article>
          </li>;
        })}
      </ol>
      {draft.transportLegs.filter(leg => leg.direction === 'return').map(leg => <div key={leg.legId} className="country-trip-return"><ArrowRight size={16} /><span>最终返程 · {leg.fromName} → {leg.toName}</span><strong>{duration(leg.estimatedMinutes)}</strong></div>)}
      {draft.candidates.length > 0 && <details className="country-trip-candidates"><summary>还可以考虑 {draft.candidates.length} 座城市</summary><p>加入后重新分配现有天数；时间不足时会提示，不会自动增加假期。</p><div>{draft.candidates.map(candidate => <button type="button" key={candidate.cityId} disabled={draft.stops.length >= capacity} onClick={() => { setCityIds([...draft.stops.map(stop => stop.cityId), candidate.cityId]); setDayAllocations(undefined); }}><Plus size={15} />{candidate.name}<small>通常 {candidate.recommendedDays} 天</small></button>)}</div></details>}
      <div className="country-trip-notes">{draft.warnings.map(warning => <p key={warning.code} className={warning.severity === 'danger' ? 'is-danger' : ''}>{['danger', 'warning'].includes(warning.severity) ? <TriangleAlert size={16} /> : <Check size={15} />}<span>{warning.message}</span></p>)}</div>
    </>}
    <footer className="country-trip-footer">{onCancel && <button type="button" className="secondary-button" onClick={onCancel}>取消</button>}<button type="button" className="primary-button" disabled={!draft?.feasible || !onApply} onClick={() => onApply(draft)}><Sparkles size={17} />{applyLabel}<ArrowRight size={17} /></button></footer>
  </section>;
}
