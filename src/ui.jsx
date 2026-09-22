import React, { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "./api.mjs";
import { X, Search, MapPin, Check, ArrowUpRight, ImageOff } from "lucide-react";

import { CURRENCIES, REGIONS } from '../shared/currencies.mjs';
export { CURRENCIES } from '../shared/currencies.mjs';
export const SYMBOLS = {
  CNY: "¥",
  USD: "$",
  EUR: "€",
  JPY: "JP¥",
  GBP: "£",
  KRW: "₩",
  THB: "฿",
  SGD: "S$",
  AUD: "A$",
  HKD: "HK$",
  AED: "AED ",
  IDR: "Rp ",
  TRY: "₺",
};
export function money(amount, currency = "CNY", decimal = false) {
  return (
    (SYMBOLS[currency] || currency + " ") +
    new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: decimal ? 2 : 0,
    }).format(Number(amount) || 0)
  );
}
export function convert(amount, from, to, rates) {
  return (amount / (rates?.rates?.[from] || 1)) * (rates?.rates?.[to] || 1);
}
export function addDays(date, n) {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + n);
  return value.toISOString().slice(0, 10);
}
export function shortDate(date) {
  return date
    ? new Intl.DateTimeFormat("zh-CN", {
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(date + "T12:00:00Z"))
    : "";
}
export function safeRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function download(name, content, type = "application/json") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Photo({ image, alt, className = "", ...props }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [image?.url]);
  return broken || !image?.url ? (
    <div className={"photo-fallback " + className} role="img" aria-label={alt}>
      <MapPin size={30} />
      <span>{alt}</span>
    </div>
  ) : (
    <img
      className={className}
      src={assetUrl(image.url)}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      {...props}
    />
  );
}
export function OutLink({ href, children, className = "" }) {
  return (
    <a
      className={"out-link " + className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const cancel = (e) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", cancel);
    return () => {
      el.removeEventListener("cancel", cancel);
      el.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "modal-wide" : "")}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="关闭弹窗">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function CityPicker({
  cities,
  onPick,
  onClose,
  exclude = [],
  title = "下一站，想去哪里？",
  currency,
  rates,
  origin = false,
  onChooseCountry,
}) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("全部");
  const [scope, setScope] = useState("all");
  const [limit, setLimit] = useState(48);
  const fold = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filtered = useMemo(() => cities.filter(
    (c) =>
      !exclude.includes(c.id) &&
      (region === "全部" || c.region === region) &&
      (scope !== 'curated' || c.coverage !== 'airport-only') &&
      (scope !== 'scheduled' || c.scheduledService) &&
      fold([c.name, c.nameEn, c.country, c.countryCode, c.iata, ...(c.tags || []), ...(c.airportCodes || []), c.subdivision].join(' ')).includes(fold(query).trim()),
  ), [cities, exclude, region, scope, query]);
  useEffect(() => setLimit(48), [query, region, scope]);
  return (
    <Modal title={title} onClose={onClose} wide>
      {onChooseCountry && <div className="planning-unit-switch" role="group" aria-label="按城市或国家添加"><button type="button" aria-pressed="true">选择城市</button><button type="button" aria-pressed="false" onClick={onChooseCountry}>探索一个国家</button></div>}
      <div className="search-box">
        <Search size={18} />
        <input
          autoFocus
          placeholder="搜索城市、国家或机场代码"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="filter-pills">
        {["全部", ...REGIONS].map((r) => (
          <button
            key={r}
            className={region === r ? "active" : ""}
            onClick={() => setRegion(r)}
          >
            {r}
          </button>
        ))}
      </div>
      <div className="filter-pills airport-scope" aria-label="目的地资料范围">
        {[["all", "全部目的地"], ["scheduled", "有定期航班记录"], ["curated", "已有旅行攻略"]].map(([id, label]) => <button key={id} className={scope === id ? "active" : ""} onClick={() => setScope(id)}>{label}</button>)}
      </div>
      <p className="small muted">
        找到 {filtered.length.toLocaleString('zh-CN')} 处目的地。机场记录不代表当前有可订航班；票价以预订页为准。
      </p>
      <div className="picker-grid">
        {filtered.slice(0, limit).map((c) => (
          <button
            key={c.id}
            className="picker-city"
            onClick={() => onPick(c.id)}
          >
            <Photo image={c.image} alt={c.name} />
            <div>
              <strong>
                {c.name} <small>{c.nameEn}</small>
              </strong>
              <span>
                {c.country} · {c.iata || c.airportCodes?.[0] || '地方机场'}{c.subdivision ? ` · ${c.subdivision}` : ''}
              </span>
              {c.coverage === 'airport-only' ? <em>{c.scheduledService ? '有定期航班记录' : '通航情况待核实'} · 食宿预算待补充</em> : !origin && (
                <em>
                  {money(
                    convert(
                      c.daily.lodging[0] / 2 +
                        c.daily.food[0] +
                        c.daily.transport[0] +
                        c.daily.misc[0],
                      c.currency,
                      currency,
                      rates,
                    ),
                    currency,
                  )}{" "}
                  / 人天起 · 估算
                </em>
              )}
            </div>
            <ArrowUpRight size={17} />
          </button>
        ))}
      </div>
      {filtered.length > limit && <button className="secondary-button full" onClick={() => setLimit(n => n + 48)}>再看 48 处目的地 · 已显示 {Math.min(limit, filtered.length)} / {filtered.length}</button>}
      {!filtered.length && (
        <div className="empty-state">
          <MapPin />
          <p>还没有找到这座城市</p>
          <small>试试国家名称，或从已收录城市中选择。</small>
        </div>
      )}
    </Modal>
  );
}
export function LineEditor({ line, currency, onApply, onReset, onClose }) {
  const [amount, setAmount] = useState(line.missingPrice ? '' : String(line.amount ?? 0));
  const [confirmed, setConfirmed] = useState(!!line.confirmed);
  const valid =
    amount.trim() !== "" &&
    Number.isFinite(Number(amount)) &&
    Number(amount) >= 0 &&
    Number(amount) <= 1e9;
  return (
    <Modal title="核对这笔费用" onClose={onClose}>
      <div className="edit-line-title">
        <h3>{line.label}</h3>
        <span className="badge">
          {line.quantity} {line.unit}
        </span>
      </div>
      <p className="muted small">
        {line.note ||
          "请以实际预订页面的含税总价核对，并检查人数、日期和取消条款。"}
      </p>
      <div className="reference-range">
        <span>该项目参考区间</span>
        <strong>
          {line.missingPrice ? '价格待补充，请录入你的预算或实际报价' : line.referenceMissingPrice ? '尚无当地参考价，已按录入金额计算' : `${money(line.unitLow * line.quantity, currency)} — ${money(line.unitHigh * line.quantity, currency)}`}
        </strong>
      </div>
      <label className="field-label" htmlFor="actual-amount">
        录入这整个项目的总价（{currency}）
      </label>
      <input
        id="actual-amount"
        className="large-input"
        type="number"
        min="0"
        max="1000000000"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <label className="check-label">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>我已核对预订页面或收据中的费用</span>
      </label>
      <p className="small muted">
        价格依据：{line.sourceName || "编辑预算"}
        {line.checkedAt
          ? " · 核验 " + line.checkedAt.slice(0, 10)
          : " · 尚无实价核验"}
      </p>
      {line.sourceUrl && (
        <OutLink href={line.sourceUrl}>打开价格来源 / 预订页面</OutLink>
      )}
      <p className="small muted">
        核对状态仅记录你的确认，不代表已付款或已完成预订。
      </p>
      <div className="modal-actions">
        <button className="text-button" onClick={onReset}>
          恢复参考预算
        </button>
        <button
          className="primary-button"
          disabled={!valid}
          onClick={() => onApply({ amount: Number(amount), confirmed })}
        >
          <Check size={17} />
          保存这笔费用
        </button>
      </div>
    </Modal>
  );
}
