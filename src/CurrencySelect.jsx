import React, { useMemo, useState } from 'react';
import { Banknote, Check, Coins, Search } from 'lucide-react';
import { CURRENCIES } from '../shared/currencies.mjs';
import { CountryFlag, SelectPopover, moveResultFocus } from './DestinationSelect.jsx';
import { foldSearch } from './destination-utils.mjs';
import './currency-select.css';

const ALL_CURRENCIES = Object.keys(CURRENCIES);
const COUNTRY = { CNY:'CN', USD:'US', EUR:'EU', JPY:'JP', GBP:'GB', KRW:'KR', THB:'TH', SGD:'SG', AUD:'AU', HKD:'HK', AED:'AE', IDR:'ID', TRY:'TR', ISK:'IS', MVR:'MV', NOK:'NO', SEK:'SE', DKK:'DK', CHF:'CH', PLN:'PL', CZK:'CZ', HUF:'HU', VND:'VN', LAK:'LA', KHR:'KH', MYR:'MY', PHP:'PH', TWD:'TW', NPR:'NP', INR:'IN', LKR:'LK', NZD:'NZ', ZAR:'ZA', MAD:'MA', EGP:'EG', KES:'KE', TZS:'TZ', SCR:'SC', MUR:'MU', CAD:'CA', MXN:'MX', PEN:'PE', BRL:'BR', ARS:'AR', CLP:'CL', COP:'CO' };
const SYMBOL = { CNY:'¥', USD:'$', EUR:'€', JPY:'¥', GBP:'£', KRW:'₩', THB:'฿', SGD:'S$', AUD:'A$', HKD:'HK$', INR:'₹', VND:'₫', PHP:'₱', TRY:'₺', IDR:'Rp', TWD:'NT$', CAD:'C$', NZD:'NZ$', BRL:'R$', CHF:'Fr', PLN:'zł' };
const POPULAR = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'HKD'];
export default function CurrencySelect({ value, onChange, label = '显示币种', className = '', disabled = false, currencies = ALL_CURRENCIES, compact = false }) {
  const [query, setQuery] = useState('');
  const codes = useMemo(() => [...new Set([...(currencies || ALL_CURRENCIES), ...(value ? [value] : [])])].filter(Boolean).sort(), [currencies, value]);
  const filtered = codes.filter(code => foldSearch(`${code} ${CURRENCIES[code] || ''}`).includes(foldSearch(query).trim()));
  const rows = (list, close) => list.map(code => <button type="button" key={code} className="currency-choice" data-destination-result aria-pressed={code === value} onClick={() => { onChange(code); close(); }}><CountryFlag code={COUNTRY[code]} /><span><strong>{CURRENCIES[code] || code}</strong><small>{code}</small></span><em>{SYMBOL[code] || ''}</em>{code === value && <Check size={16} />}</button>);
  return <SelectPopover label={label} disabled={disabled} compact className={`currency-select ${compact ? 'currency-select-inline' : ''} ${className}`} panelClassName="currency-popover" selection={<><CountryFlag code={COUNTRY[value]} /><span className="currency-current"><strong>{CURRENCIES[value] || value || '选择币种'}</strong><small>{value}</small></span></>}>
    {close => <div className="currency-browser" onKeyDown={moveResultFocus}><div className="destination-search"><Search size={16} /><input autoFocus aria-label="搜索币种" value={query} onChange={event => setQuery(event.target.value)} placeholder="人民币、美元、USD…" /></div>{!query && <section><h4><Coins size={15} />常用币种</h4><div className="currency-options">{rows(POPULAR.filter(code => codes.includes(code)), close)}</div></section>}<section><h4><Banknote size={15} />{query ? '搜索结果' : '全部币种 · A–Z'}</h4><div className="currency-options">{rows(filtered, close)}</div>{!filtered.length && <p className="destination-empty">没有找到该币种。</p>}</section></div>}
  </SelectPopover>;
}
