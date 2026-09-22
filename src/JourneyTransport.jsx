import React, { useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Plane,
  TrainFront,
  Ship,
  Car,
  RotateCcw,
  ChevronDown,
  Check,
  MapPin,
} from "lucide-react";
import {
  buildJourneyWindows,
  estimateJourneyLeg,
  journeyTimeLabel,
  normalizeTransportWindow,
} from "../shared/journey-windows.mjs";
import { money } from "./ui.jsx";
import "./journey-transport.css";

const MODE = {
  air: { icon: Plane, label: "航空与接驳预留" },
  rail: { icon: TrainFront, label: "近程陆路预留" },
  boat: { icon: Ship, label: "跨岛船程预留" },
  road: { icon: Car, label: "公路交通预留" },
};
const duration = (minutes) =>
  `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ""}`;
const formattedWindow = (window) =>
  window.travelOnly
    ? "交通日 · 暂不安排游览"
    : !window.inbound && !window.outbound
      ? "完整游览日，按每日开始时间安排"
      : `${journeyTimeLabel(window.startMinute)}–${journeyTimeLabel(window.endMinute)} 可安排活动`;

export default function JourneyTransport({ plan, cities, budget, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const [error, setError] = useState("");
  const byId = useMemo(
    () => new Map(cities.map((city) => [city.id, city])),
    [cities],
  );
  const windows = useMemo(
    () => buildJourneyWindows(plan, cities),
    [plan, cities],
  );
  const legs = useMemo(() => {
    const rows = [];
    let previous = byId.get(plan.originId);
    plan.stops.forEach((stop, index) => {
      const city = byId.get(stop.cityId);
      const leg = estimateJourneyLeg(previous, city, `leg-${index}`);
      if (leg) rows.push({ ...leg, stopIndex: index, isReturn: false });
      previous = city;
    });
    if (plan.returnTrip !== false) {
      const leg = estimateJourneyLeg(
        previous,
        byId.get(plan.originId),
        "leg-return",
      );
      if (leg)
        rows.push({ ...leg, stopIndex: plan.stops.length - 1, isReturn: true });
    }
    return rows;
  }, [byId, plan]);
  const total =
    budget?.lines
      ?.filter((line) => ["intercity", "transfer"].includes(line.category))
      .reduce((sum, line) => sum + (Number(line.amount) || 0), 0) || 0;
  const last = plan.stops.length - 1;
  const hasReturn = legs.some((leg) => leg.isReturn) && plan.mode !== "stay";

  function change(index, patch) {
    try {
      const current = normalizeTransportWindow(
        plan.stops[index].transportWindow,
        plan.stops[index].days,
      );
      const next = { ...current, ...patch };
      if (patch.arrivalReadyTime === "") {
        delete next.arrivalReadyTime;
        delete next.arrivalDayOffset;
      }
      if (patch.departureLeaveTime === "") delete next.departureLeaveTime;
      const checked = normalizeTransportWindow(next, plan.stops[index].days);
      setError("");
      onChange(index, checked);
    } catch (problem) {
      setError(problem.message || "交通时间设置无效");
    }
  }

  return (
    <section
      className="jt-panel"
      aria-label="跨城交通与可游览时间"
      data-testid="journey-transport"
    >
      <div className="jt-header">
        <span className="jt-heading-icon">
          <Clock3 size={20} />
        </span>
        <span className="jt-heading-copy">
          <strong>为路上的时间留白</strong>
          <small>把抵达、换城和返程时间一起放进行程</small>
        </span>
        <span className="jt-header-cost">
          {money(total, budget?.currency || plan.currency)}
          <small>路费及接驳已计入总预算</small>
        </span>
      </div>
      <div className="jt-content">
        <p className="jt-intro" hidden={!expanded}>
          自动规划会按距离、候车候机和接驳预留时间，长途分配到多个日期。已有车票或机票时，请填写在目的地当地最早可开始活动、以及返程前最晚结束游览的时间。
        </p>
        {legs.length ? (
          <div className="jt-leg-list">
            {legs.map((leg) => {
              const { icon: Icon, label } = MODE[leg.mode] || MODE.air;
              const cost = budget?.legs?.find((item) => item.id === leg.legId);
              const overrides = normalizeTransportWindow(
                plan.stops[leg.stopIndex].transportWindow,
                plan.stops[leg.stopIndex].days,
              );
              const customized = leg.isReturn
                ? !!overrides.departureLeaveTime
                : overrides.arrivalReadyTime !== undefined ||
                  overrides.arrivalDayOffset !== undefined;
              return (
                <div
                  className="jt-leg"
                  key={leg.legId}
                  data-testid="journey-leg"
                  data-leg-id={leg.legId}
                >
                  <span className="jt-leg-icon">
                    <Icon size={17} />
                  </span>
                  <div className="jt-leg-route">
                    <strong>
                      {leg.fromName}
                      <ArrowRight size={12} />
                      {leg.toName}
                      {leg.isReturn && <em>返程</em>}
                    </strong>
                    <span>
                      {label} · 约 {duration(leg.estimatedMinutes)}
                      {leg.estimatedMinutes > 690
                        ? `，分 ${Math.ceil(leg.estimatedMinutes / 690)} 个活动日预留`
                        : ""}
                    </span>
                    {customized && (
                      <small>
                        <Check size={11} />
                        已按你填写的当地活动边界调整
                      </small>
                    )}
                    {leg.isReturn && plan.mode === "stay" && (
                      <small>
                        旅居返程在停留结束次日，不占最后一个生活日。
                      </small>
                    )}
                  </div>
                  <div className="jt-leg-price">
                    {cost
                      ? money(cost.amount, budget?.currency || plan.currency)
                      : "待核价"}
                    <small>已在总额中</small>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="jt-local-only">
            <MapPin size={15} />
            这份计划没有跨城交通，可直接安排当地活动。
          </p>
        )}
        <div className="jt-details-heading">
          <span>各站可游览时间</span>
          <button
            type="button"
            className="jt-details-toggle"
            data-testid="journey-details-toggle"
            aria-expanded={expanded}
            aria-controls={plan.stops
              .map((_, index) => `${detailsId}-${index}`)
              .join(" ")}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "收起细节" : "补充细节"}
            <ChevronDown size={13} />
          </button>
        </div>
        <div className="jt-stop-list" data-details-expanded={expanded}>
          {plan.stops.map((stop, index) => {
            const city = byId.get(stop.cityId);
            const setting = normalizeTransportWindow(
              stop.transportWindow,
              stop.days,
            );
            const daily = windows[index];
            const customized = Object.keys(setting).length > 0;
            const firstUsable = daily.findIndex((day) => !day.travelOnly);
            const inputId = `jt-arrival-${index}`;
            const visibleNotes = [
              ...new Set(
                daily
                  .filter((day) => /不足|重叠|之外/.test(day.note))
                  .map((day) => day.note),
              ),
            ];
            return (
              <div className="jt-stop" key={`${index}-${stop.cityId}`}>
                <div className="jt-stop-heading">
                  <span>
                    <i>{index + 1}</i>
                    <strong>{city?.name || "目的地"}</strong>
                    <small>{stop.days} 天</small>
                  </span>
                  {expanded && customized && (
                    <button
                      type="button"
                      className="jt-reset"
                      onClick={() => {
                        setError("");
                        onChange(index, {});
                      }}
                      aria-label={`恢复${city?.name || "本站"}自动交通预留`}
                    >
                      <RotateCcw size={12} />
                      恢复自动
                    </button>
                  )}
                </div>
                <div
                  className="jt-fields"
                  id={`${detailsId}-${index}`}
                  hidden={!expanded}
                >
                  <label htmlFor={inputId}>
                    <span>抵达后可开始活动的当地时间</span>
                    <input
                      id={inputId}
                      type="time"
                      value={setting.arrivalReadyTime || ""}
                      aria-label={`${city?.name}抵达后可开始活动的当地时间`}
                      onChange={(event) =>
                        change(index, {
                          arrivalReadyTime: event.target.value,
                          arrivalDayOffset: setting.arrivalDayOffset ?? 0,
                        })
                      }
                    />
                    <small>选填 · 已包含入境、取行李与前往市区</small>
                  </label>
                  <label htmlFor={`jt-offset-${index}`}>
                    <span>在哪一天可以开始活动</span>
                    <select
                      id={`jt-offset-${index}`}
                      value={setting.arrivalDayOffset ?? 0}
                      disabled={!setting.arrivalReadyTime}
                      aria-label={`${city?.name}抵达可活动日`}
                      onChange={(event) =>
                        change(index, {
                          arrivalDayOffset: Number(event.target.value),
                        })
                      }
                    >
                      {Array.from({ length: 15 }, (_, day) => (
                        <option value={day} key={day}>
                          本站第 {day + 1} 天
                          {day >= stop.days ? " · 超出当前停留" : ""}
                        </option>
                      ))}
                    </select>
                    <small>跨夜抵达时调整日期；按目的地当地日期填写</small>
                  </label>
                  {index === last && hasReturn && (
                    <label htmlFor="jt-return-time">
                      <span>返程日最晚结束游览的当地时间</span>
                      <input
                        id="jt-return-time"
                        type="time"
                        value={setting.departureLeaveTime || ""}
                        aria-label="返程日最晚结束游览的当地时间"
                        onChange={(event) =>
                          change(index, {
                            departureLeaveTime: event.target.value,
                          })
                        }
                      />
                      <small>选填 · 在此时间离开景点，另留足接驳与候机</small>
                    </label>
                  )}
                </div>
                <div
                  className="jt-window-summary"
                  data-testid="journey-window-summary"
                >
                  <Clock3 size={13} />
                  <span>
                    {firstUsable === -1
                      ? "当前停留均被交通预留占用，请增加天数或核对实际时间。"
                      : `本站第 ${firstUsable + 1} 天：${formattedWindow(daily[firstUsable])}${firstUsable > 0 ? `；此前 ${firstUsable} 天保留给交通` : ""}`}
                    {index === last && hasReturn && firstUsable !== -1
                      ? `。最后一天：${formattedWindow(daily.at(-1))}`
                      : ""}
                  </span>
                </div>
                {visibleNotes.length > 0 && (
                  <div className="jt-warning" role="status">
                    {visibleNotes.slice(0, 2).map((warning, i) => (
                      <p key={i}>{warning}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="jt-footnote" hidden={!expanded}>
          这些设置是当地可游览的时间边界，预留只用于分配行程，不是实时航线或航班起降时刻。自动模型未推算时差与转机班次。自动计划会重新精选；手动安排保留并提示冲突，可在日程工作台智能重排。每段展示的路费与顶部汇总中的接驳费均已计入总预算，不重复收费。
        </p>
        {error && (
          <p className="jt-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
