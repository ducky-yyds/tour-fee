import React, { useId, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Clock3, Plane, TrainFront, Ship, Car, RotateCcw, ChevronDown, Check, MapPin } from "lucide-react";
import { buildJourneyWindows, estimateJourneyLeg, journeyTimeLabel, normalizeTransportWindow } from "../shared/journey-windows.mjs";
import { getJourneyModePreference, listJourneyModes } from "../shared/journey-mode.mjs";
import { money } from "./ui.jsx";
import "./journey-transport.css";

const MODE = {
  air: { icon: Plane, label: "飞机" },
  "high-speed-rail": { icon: TrainFront, label: "高铁 / 动车" },
  rail: { icon: TrainFront, label: "铁路" },
  boat: { icon: Ship, label: "渡船" },
  road: { icon: Car, label: "公路" },
};
const duration = (minutes) => `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ""}`;
const formattedWindow = (window) => window.travelOnly ? "交通日 · 暂不安排游览" : !window.inbound && !window.outbound ? "完整游览日" : `${journeyTimeLabel(window.startMinute)}–${journeyTimeLabel(window.endMinute)} 可活动`;

/** Compact contents for the intercity budget popover. Costs already belong to the budget. */
export default function JourneyTransport({ plan, cities, budget, onChange, onModeChange, onEditLine }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const [error, setError] = useState("");
  const byId = useMemo(() => new Map(cities.map((city) => [city.id, city])), [cities]);
  const windows = useMemo(() => buildJourneyWindows(plan, cities), [plan, cities]);
  const legs = useMemo(() => {
    const rows = [];
    const append = (from, to, legId, stopIndex, isReturn) => {
      const preferredMode = getJourneyModePreference(plan, legId, from, to);
      const leg = estimateJourneyLeg(from, to, legId, preferredMode);
      if (leg) rows.push({ ...leg, stopIndex, isReturn, preferredMode, options: listJourneyModes(from, to, leg.distanceKm) });
    };
    let previous = byId.get(plan.originId);
    plan.stops.forEach((stop, index) => {
      const city = byId.get(stop.cityId);
      append(previous, city, `leg-${index}`, index, false);
      previous = city;
    });
    if (plan.returnTrip !== false) append(previous, byId.get(plan.originId), "leg-return", plan.stops.length - 1, true);
    return rows;
  }, [byId, plan]);
  const last = plan.stops.length - 1;
  const hasReturn = legs.some((leg) => leg.isReturn) && plan.mode !== "stay";
  const currency = budget?.currency || plan.currency;

  function change(index, patch) {
    try {
      const current = normalizeTransportWindow(plan.stops[index].transportWindow, plan.stops[index].days);
      const next = { ...current, ...patch };
      if (patch.arrivalReadyTime === "") { delete next.arrivalReadyTime; delete next.arrivalDayOffset; }
      if (patch.departureLeaveTime === "") delete next.departureLeaveTime;
      const checked = normalizeTransportWindow(next, plan.stops[index].days);
      setError("");
      onChange(index, checked);
    } catch (problem) { setError(problem.message || "交通时间设置无效"); }
  }

  return <div className="jt-panel" aria-label="城际交通明细" data-testid="journey-transport">
    {legs.length ? <div className="jt-leg-list">
      {legs.map((leg) => {
        const { icon: Icon, label } = MODE[leg.mode] || MODE.air;
        const cost = budget?.legs?.find((item) => item.id === leg.legId);
        const line = budget?.lines?.find((item) => item.id === leg.legId);
        const transfer = budget?.lines?.find((item) => item.id === leg.legId.replace(/^leg-/, "transfer-"));
        const overrides = normalizeTransportWindow(plan.stops[leg.stopIndex].transportWindow, plan.stops[leg.stopIndex].days);
        const customized = leg.isReturn ? !!overrides.departureLeaveTime : overrides.arrivalReadyTime !== undefined || overrides.arrivalDayOffset !== undefined;
        const selectedOption = leg.options.find((option) => option.mode === (leg.preferredMode || "auto"));
        return <article className="jt-leg" key={leg.legId} data-testid="journey-leg" data-leg-id={leg.legId}>
          <div className="jt-leg-heading">
            <span className="jt-leg-icon"><Icon size={17} /></span>
            <div className="jt-leg-route">
              <strong>{leg.fromName}<ArrowRight size={12} />{leg.toName}{leg.isReturn && <em>返程</em>}</strong>
              <span>{leg.modeLabel || label} · 连同接驳约 {duration(leg.estimatedMinutes)}{leg.estimatedMinutes > 690 ? ` · 分 ${Math.ceil(leg.estimatedMinutes / 690)} 天预留` : ""}</span>
            </div>
            <div className="jt-leg-price">{cost ? money(cost.amount, currency) : "待核价"}<small>{plan.travelers} 人 · 单程</small></div>
          </div>
          {onModeChange && leg.options.length > 1 && <div className="jt-mode-options" role="group" aria-label={`${leg.fromName}到${leg.toName}交通方式`}>
            {leg.options.map((option) => <button type="button" key={option.mode} className={(leg.preferredMode || "auto") === option.mode ? "active" : ""} aria-pressed={(leg.preferredMode || "auto") === option.mode} title={option.note} onClick={() => onModeChange(leg.legId, option.mode)}>{option.label}</button>)}
          </div>}
          {customized && <p className="jt-customized"><Check size={11} />已采用你填写的当地活动时间</p>}
          <details className="jt-leg-notes">
            <summary>价格与交通参考<ChevronDown size={12} /></summary>
            <div>
              {cost && <p>票费区间 {money(cost.low, currency)} — {money(cost.high, currency)}；当前金额已包含在总预算。</p>}
              <p>{transfer ? `两端接驳 ${money(transfer.amount, currency)}，已计入“车站 / 机场接驳”项。` : "本段没有另收机场接驳费用。"}</p>
              {selectedOption?.note && <p>{selectedOption.note}</p>}
              {line?.note && <p>{line.note}</p>}
              {leg.isReturn && plan.mode === "stay" && <p>旅居返程在停留结束次日，不占最后一个生活日。</p>}
              <div className="jt-leg-links">
                {(line?.sourceUrl || cost?.link || selectedOption?.sourceUrl) && <a href={line?.sourceUrl || cost?.link || selectedOption?.sourceUrl} target="_blank" rel="noopener noreferrer">核对路线 / 票价<ArrowUpRight size={12} /></a>}
                {onEditLine && line && <button type="button" onClick={() => onEditLine(line.id)}>填写实际费用</button>}
              </div>
            </div>
          </details>
        </article>;
      })}
    </div> : <p className="jt-local-only"><MapPin size={15} />这份计划没有跨城交通。</p>}
    <div className="jt-details-heading">
      <span><Clock3 size={13} />抵达与离开</span>
      <button type="button" className="jt-details-toggle" data-testid="journey-details-toggle" aria-expanded={expanded} aria-controls={`${detailsId}-stops`} onClick={() => setExpanded((value) => !value)}>{expanded ? "收起设置" : "填写实际时间"}<ChevronDown size={13} /></button>
    </div>
    {expanded && <p className="jt-intro">按当地时间填写可开始活动、最晚结束游览的时刻，包含取行李、接驳与候车候机预留。</p>}
    <div className="jt-stop-list" id={`${detailsId}-stops`} data-details-expanded={expanded}>
      {plan.stops.map((stop, index) => {
        const city = byId.get(stop.cityId);
        const setting = normalizeTransportWindow(stop.transportWindow, stop.days);
        const daily = windows[index] || [];
        const customized = Object.keys(setting).length > 0;
        const firstUsable = daily.findIndex((day) => !day.travelOnly);
        const inputId = `${detailsId}-arrival-${index}`;
        const visibleNotes = [...new Set(daily.filter((day) => /不足|重叠|之外/.test(day.note)).map((day) => day.note))];
        return <div className="jt-stop" key={`${index}-${stop.cityId}`}>
          <div className="jt-stop-heading">
            <span><strong>{city?.name || "目的地"}</strong><small>{stop.days} 天</small></span>
            {expanded && customized && <button type="button" className="jt-reset" onClick={() => { setError(""); onChange(index, {}); }} aria-label={`恢复${city?.name || "本站"}自动交通预留`}><RotateCcw size={12} />恢复自动</button>}
          </div>
          <p className="jt-window-summary" data-testid="journey-window-summary">{firstUsable === -1 ? "交通已占满当前停留，请增加天数或填写实际时间。" : `第 ${firstUsable + 1} 天起：${formattedWindow(daily[firstUsable])}${firstUsable > 0 ? `；前 ${firstUsable} 天用于交通` : ""}`}{index === last && hasReturn && firstUsable !== -1 ? `。最后一天：${formattedWindow(daily.at(-1))}` : ""}</p>
          {expanded && <div className="jt-fields">
            <label htmlFor={inputId}><span>抵达后可开始活动</span><input id={inputId} type="time" value={setting.arrivalReadyTime || ""} aria-label={`${city?.name}抵达后可开始活动的当地时间`} onChange={(event) => change(index, { arrivalReadyTime: event.target.value, arrivalDayOffset: setting.arrivalDayOffset ?? 0 })} /><small>选填 · 已包含入境、行李与市区接驳</small></label>
            <label htmlFor={`${detailsId}-offset-${index}`}><span>开始活动的日期</span><select id={`${detailsId}-offset-${index}`} value={setting.arrivalDayOffset ?? 0} disabled={!setting.arrivalReadyTime} aria-label={`${city?.name}抵达可活动日`} onChange={(event) => change(index, { arrivalDayOffset: Number(event.target.value) })}>{Array.from({ length: 15 }, (_, day) => <option value={day} key={day}>本站第 {day + 1} 天{day >= stop.days ? " · 超出停留" : ""}</option>)}</select><small>跨夜抵达时，按目的地当地日期选择</small></label>
            {index === last && hasReturn && <label htmlFor={`${detailsId}-return`}><span>返程日最晚结束游览</span><input id={`${detailsId}-return`} type="time" value={setting.departureLeaveTime || ""} aria-label="返程日最晚结束游览的当地时间" onChange={(event) => change(index, { departureLeaveTime: event.target.value })} /><small>此后需留足前往车站 / 机场和候车候机的时间</small></label>}
          </div>}
          {visibleNotes.length > 0 && <div className="jt-warning" role="status">{visibleNotes.slice(0, 2).map((warning, i) => <p key={i}>{warning}</p>)}</div>}
        </div>;
      })}
    </div>
    <p className="jt-footnote">耗时用于行程预留，实际车次、航班与转乘需另核对。切换交通方式会同步更新预算和可活动时间。</p>
    {error && <p className="jt-error" role="alert">{error}</p>}
  </div>;
}
