import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  Footprints,
  GripVertical,
  Info,
  MapPin,
  Navigation,
  Plane,
  Plus,
  Route,
  Settings2,
  Search,
  Sparkles,
  Sun,
  Ticket,
  TrainFront,
  Ship,
  Car,
  BedDouble,
  Coffee,
  Trash2,
  Undo2,
  Utensils,
  Wallet,
  X,
  TriangleAlert,
} from "lucide-react";
import {
  buildDayAssignments,
  optimizeDayRoute,
  getVisitDurationRange,
} from "../shared/itinerary.mjs";
import {
  Photo,
  OutLink,
  Modal,
  money,
  shortDate,
  addDays,
  download,
  convert,
} from "./ui.jsx";
import "./itinerary.css";
import "./routine-timeline.css";
import { getItineraryMedia } from "./itinerary-media.mjs";
import { suggestJourneyStop } from "../shared/journey-planning.mjs";
import {
  resolveExperienceSelections,
  applyExperienceSelection,
  removeExperienceSelection,
} from "../shared/experiences.mjs";

export function durationLabel(minutes) {
  const n = Math.max(0, Math.round(minutes || 0));
  if (n < 60) return `${n} 分钟`;
  return `${Math.floor(n / 60)} 小时${n % 60 ? " " + (n % 60) + " 分钟" : ""}`;
}
const featureText = (a) =>
  a.features?.length
    ? a.features.slice(0, 3)
    : [a.category || "城市风景", a.bestTime || "慢慢探索"];

const hasTimelineTime = (item) =>
  Boolean(item.time) &&
  item.timing !== "unscheduled" &&
  !item.allowance &&
  !item.includedInExperience &&
  !item.includedInVisit &&
  !item.duringJourney;

function timelineIcon(item) {
  if (item.kind === "meal")
    return item.mealType === "breakfast" ? Coffee : Utensils;
  if (item.kind === "hotel") return BedDouble;
  if (item.routineType === "citywalk") return Footprints;
  if (item.kind === "journey-transfer") return Car;
  const mode = item.segment?.mode || item.transportMode;
  if (mode === "walk") return Footprints;
  if (mode === "boat") return Ship;
  if (mode === "road") return Car;
  if (["high-speed-rail", "rail", "transit"].includes(mode)) return TrainFront;
  if (item.journey || ["arrival", "departure"].includes(item.kind))
    return Plane;
  return item.kind === "transport" ? TrainFront : Sun;
}

export default function ItineraryPlanner({
  plan,
  cities,
  rates,
  itinerary,
  onUpdateStop,
  onAddCustomAttraction,
  onToast,
  onEditLine,
  onOpenCity,
  priceSamples = [],
}) {
  const [mode, setMode] = useState("preview");
  const [selectedDay, setSelectedDay] = useState(0);
  const [editingStop, setEditingStop] = useState(0);
  const [pickerDay, setPickerDay] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [undo, setUndo] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const detailsId = useId();
  const [wishlistDay, setWishlistDay] = useState(0);
  const dayRefs = useRef({});
  const safeStop = Math.min(editingStop, plan.stops.length - 1);
  const stop = plan.stops[safeStop];
  const city = cities.find((c) => c.id === stop.cityId);
  const assignments = useMemo(
    () => buildDayAssignments(stop, city),
    [stop, city],
  );
  const selected = itinerary[Math.min(selectedDay, itinerary.length - 1)];
  const stopDays = itinerary.filter((d) => d.stopIndex === safeStop);
  const elapsed = plan.stops.slice(0, safeStop).reduce((n, s) => n + s.days, 0);
  const selectedCount = plan.stops.reduce(
    (n, s) => n + s.attractionIds.length,
    0,
  );
  const planningWarnings = plan.stops.flatMap((s, stopIndex) =>
    (s.smartPlan?.warnings || [])
      .filter(
        (w) =>
          w.code === "requested-attractions-deferred" &&
          w.attractionIds?.some(
            (id) =>
              s.requestedAttractionIds?.includes(id) &&
              s.deferredAttractionIds?.includes(id),
          ),
      )
      .map((w) => {
        const destination = cities.find((c) => c.id === s.cityId);
        const pendingNames = w.attractionIds
          .filter(
            (id) =>
              s.requestedAttractionIds?.includes(id) &&
              s.deferredAttractionIds?.includes(id),
          )
          .map(
            (id) =>
              destination?.attractions.find((place) => place.id === id)?.name,
          )
          .filter(Boolean);
        return {
          ...w,
          stopIndex,
          cityName: destination?.name,
          message: `${pendingNames.join("、")}尚未排入：现有时间、交通窗口、开放限制或位置资料不足以安排。选择已保留，可增加天数、调整时长或手动分配。`,
        };
      }),
  );
  const unavailable = city.attractions.filter(
    (a) => !stop.attractionIds.includes(a.id),
  );
  const wishlist = unavailable.filter((a) =>
    stop.deferredAttractionIds?.includes(a.id),
  );
  useEffect(() => {
    setSelectedDay((n) => Math.min(n, Math.max(0, itinerary.length - 1)));
  }, [itinerary.length]);
  useEffect(() => {
    setUndo(null);
    setPickerDay(null);
    setWishlistDay(0);
  }, [safeStop, stop.cityId]);
  function snapshot() {
    return {
      cityId: stop.cityId,
      stopIndex: safeStop,
      dayPlans: assignments.map((d) => [...d]),
      attractionIds: [...stop.attractionIds],
      requestedAttractionIds: [...(stop.requestedAttractionIds || [])],
      days: stop.days,
      startTime: stop.startTime,
      visitDurations: { ...stop.visitDurations },
      deferredAttractionIds: [...(stop.deferredAttractionIds || [])],
      planningMode: stop.planningMode,
      smartPlan: stop.smartPlan,
      experienceSelections: structuredClone(stop.experienceSelections || []),
    };
  }
  function commit(dayPlans, extra = {}, message) {
    const previousSchedule = snapshot();
    const applied = onUpdateStop(safeStop, { dayPlans, ...extra });
    if (applied === false) return;
    setUndo(previousSchedule);
    if (message) onToast(message);
  }
  function move(id, dayIndex, targetIndex) {
    const next = assignments.map((day) => day.filter((a) => a !== id));
    const sourceDay = assignments.findIndex((day) => day.includes(id));
    const sourceIndex = assignments[sourceDay]?.indexOf(id) ?? -1;
    const index =
      targetIndex === undefined
        ? next[dayIndex].length
        : targetIndex -
          (sourceDay === dayIndex && sourceIndex < targetIndex ? 1 : 0);
    next[dayIndex].splice(
      Math.max(0, Math.min(index, next[dayIndex].length)),
      0,
      id,
    );
    commit(next);
    setDragging(null);
    setDropTarget(null);
  }
  function swap(dayIndex, index, offset) {
    const next = assignments.map((d) => [...d]);
    const a = next[dayIndex];
    [a[index], a[index + offset]] = [a[index + offset], a[index]];
    commit(next);
  }
  function remove(id) {
    commit(
      assignments.map((day) => day.filter((a) => a !== id)),
      {
        attractionIds: stop.attractionIds.filter((a) => a !== id),
        requestedAttractionIds: (stop.requestedAttractionIds || []).filter(
          (a) => a !== id,
        ),
        deferredAttractionIds: [
          ...new Set([...(stop.deferredAttractionIds || []), id]),
        ],
      },
      "已移回候选清单，门票预算同步更新",
    );
  }
  function add(id, day) {
    const next = assignments.map((d) => [...d]);
    next[day].push(id);
    commit(
      next,
      {
        attractionIds: [...stop.attractionIds, id],
        requestedAttractionIds: [
          ...new Set([...(stop.requestedAttractionIds || []), id]),
        ],
        deferredAttractionIds: (stop.deferredAttractionIds || []).filter(
          (a) => a !== id,
        ),
      },
      "景点已加入这一天",
    );
    setPickerDay(null);
  }
  function changeDuration(id, minutes) {
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 720) return;
    commit(
      assignments.map((day) => [...day]),
      { visitDurations: { ...stop.visitDurations, [id]: minutes } },
    );
  }
  function smartReplan(includeNeighborhoods = false) {
    const candidateIds = [
      ...new Set([
        ...stop.attractionIds,
        ...(stop.deferredAttractionIds || []),
        ...(includeNeighborhoods
          ? city.attractions
              .filter(
                (a) =>
                  a.visitRole === "neighborhood" &&
                  a.automaticPlanning !== false &&
                  a.price?.type !== "missing" &&
                  a.price?.low === 0 &&
                  a.price?.high === 0,
              )
              .map((a) => a.id)
          : []),
      ]),
    ];
    try {
      const result = suggestJourneyStop(plan, cities, safeStop, {
        candidateIds: candidateIds.length
          ? candidateIds
          : city.attractions.map((a) => a.id),
      });
      commit(
        result.dayPlans,
        {
          attractionIds: result.attractionIds,
          deferredAttractionIds: result.deferredAttractionIds,
          requestedAttractionIds: result.requestedAttractionIds,
          visitDurations: result.visitDurations,
          smartPlan: result.smartPlan,
          planningMode: "smart",
          experienceSelections: result.experienceSelections,
        },
        `已智能安排 ${result.attractionIds.length} 个景点${result.deferredAttractionIds.length ? `，其余 ${result.deferredAttractionIds.length} 个保留在候选清单` : ""}，可撤回`,
      );
    } catch (error) {
      onToast(error.message || "暂时无法生成建议，请继续手动安排");
    }
  }
  function addCustom(attraction) {
    const previous = snapshot();
    const applied = onAddCustomAttraction?.(safeStop, attraction, pickerDay);
    if (applied === false || !onAddCustomAttraction) return false;
    setUndo(previous);
    setPickerDay(null);
    onToast("已加入自定义地点，时长和门票同步计入计划");
    return true;
  }
  function splitDay(day) {
    const next = assignments.map((d) => [...d]);
    if (!next[day].length) return;
    if (day === next.length - 1) {
      if (stop.days >= 365) {
        onToast("这座城市已达到 365 天上限");
        return;
      }
      next.push([]);
    }
    const moved = next[day].splice(
      Math.max(1, Math.ceil(next[day].length / 2)),
    );
    if (!moved.length) moved.push(next[day].pop());
    next[day + 1].unshift(...moved);
    commit(
      next,
      { days: next.length },
      `已将 ${moved.length} 个景点移到下一天`,
    );
  }
  function onDrop(e, dayIndex, targetIndex) {
    e.preventDefault();
    e.stopPropagation();
    const id = dragging || e.dataTransfer.getData("text/plain");
    let insertionIndex = targetIndex;
    if (insertionIndex !== undefined) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height / 2) insertionIndex++;
    }
    if (stop.attractionIds.includes(id)) move(id, dayIndex, insertionIndex);
  }
  function undoLast() {
    if (!undo || undo.cityId !== stop.cityId) return;
    const applied = onUpdateStop(undo.stopIndex, {
      dayPlans: undo.dayPlans,
      attractionIds: undo.attractionIds,
      requestedAttractionIds: undo.requestedAttractionIds,
      days: undo.days,
      startTime: undo.startTime,
      visitDurations: undo.visitDurations,
      deferredAttractionIds: undo.deferredAttractionIds,
      planningMode: undo.planningMode,
      smartPlan: undo.smartPlan,
      experienceSelections: undo.experienceSelections,
    });
    if (applied === false) return;
    setUndo(null);
    onToast("已撤回上一次日程调整");
  }
  const previewDays = expanded
    ? itinerary.slice(0, 60)
    : selected
      ? [selected]
      : [];
  return (
    <section className="itinerary-workspace" aria-label="每日行程工作台">
      <div className="journal-heading">
        <div>
          <span className="eyebrow">A DAY WELL SPENT</span>
          <h2>让每一天，有自己的节奏。</h2>
          <p>
            {plan.stops.length} 座城市 · {itinerary.length} 天 · {selectedCount}{" "}
            个已选景点，一起慢慢走过。
          </p>
        </div>
        <button
          className="journal-export icon-button"
          aria-label="导出完整每日行程"
          onClick={() =>
            download(
              "途算-每日行程.json",
              JSON.stringify({ version: 2, plan, itinerary }, null, 2),
            )
          }
        >
          <ArrowDownToLine size={19} />
        </button>
      </div>
      <div className="journal-toolbar">
        <div className="journal-mode" role="group" aria-label="行程展示模式">
          <button
            className={mode === "preview" ? "active" : ""}
            onClick={() => setMode("preview")}
          >
            <Compass size={16} />
            行程预览
          </button>
          <button
            className={mode === "edit" ? "active" : ""}
            onClick={() => setMode("edit")}
          >
            <Settings2 size={16} />
            调配景点
          </button>
        </div>
        <span className="journal-live">
          <span />
          随你的安排更新
        </span>
      </div>
      {!!planningWarnings.length && (
        <div className="journal-warnings" role="status">
          {planningWarnings.map((warning, index) => (
            <p key={`${warning.stopIndex}-${warning.code}-${index}`}>
              <TriangleAlert size={15} />
              <span>
                {warning.cityName} · {warning.message}
              </span>
            </p>
          ))}
        </div>
      )}
      {plan.stops.some((s) => s.experienceSelections?.length) && (
        <section className="selected-experiences panel">
          <div className="panel-heading">
            <h3>
              <Sparkles size={17} /> 已选餐桌、住处与体验
            </h3>
            <small>与当前旅行项目一起保存</small>
          </div>
          {plan.stops.map((s, stopIndex) => {
            const destination = cities.find((c) => c.id === s.cityId);
            let rows = [];
            try {
              rows = resolveExperienceSelections(s, destination);
            } catch {
              return null;
            }
            return rows.map((row) => (
              <div
                className="selected-experience-row"
                key={`${stopIndex}:${row.key}`}
              >
                <div>
                  <strong>{row.experience.name}</strong>
                  <small>
                    {destination.name} · {row.option.name}
                    {row.selection.scheduleStatus === "needs-more-days"
                      ? " · 待安排，请增加天数或调整时段"
                      : ""}
                  </small>
                </div>
                {row.experience.kind !== "hotel" ? (
                  <select
                    aria-label={`${row.experience.name}安排日期`}
                    value={row.selection.dayIndex}
                    onChange={(e) => {
                      try {
                        const base = removeExperienceSelection(
                          s,
                          destination,
                          row.key,
                        );
                        const next = applyExperienceSelection(
                          base,
                          destination,
                          {
                            ...row.selection,
                            dayIndex: Number(e.target.value),
                            scheduleStatus: undefined,
                          },
                        );
                        onUpdateStop(stopIndex, {
                          experienceSelections: next.experienceSelections,
                        });
                        onToast(
                          "已调整日期，请查看时间冲突与路程提示；同餐次餐厅会替换",
                        );
                      } catch (error) {
                        onToast(error.message);
                      }
                    }}
                  >
                    {Array.from({ length: s.days }, (_, i) => (
                      <option value={i} key={i}>
                        {destination.name}第 {i + 1} 天
                        {row.selection.mealType
                          ? ` · ${{ breakfast: "早餐", lunch: "午餐", dinner: "晚餐" }[row.selection.mealType]}`
                          : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="badge green">整站住宿</span>
                )}
                <button
                  className="icon-button"
                  aria-label={`调整${row.experience.name}套餐`}
                  onClick={() => onOpenCity?.(destination.id)}
                >
                  <Settings2 size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`移除${row.experience.name}`}
                  onClick={() =>
                    onUpdateStop(stopIndex, {
                      experienceSelections: removeExperienceSelection(
                        s,
                        destination,
                        row.key,
                      ).experienceSelections,
                    })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ));
          })}
        </section>
      )}

      {mode === "preview" && (
        <>
          <div className="journal-day-nav" aria-label="选择行程日期">
            {itinerary.map((d, i) => (
              <button
                key={i}
                className={i === selectedDay ? "active" : ""}
                onClick={() => {
                  setSelectedDay(i);
                  setExpanded(false);
                }}
              >
                <span>DAY {String(d.day).padStart(2, "0")}</span>
                <strong>{cities.find((c) => c.id === d.cityId)?.name}</strong>
                <small>{shortDate(d.date)}</small>
                {d.warnings?.some((w) => w.severity !== "info") && (
                  <i title="这一天有规划提示" />
                )}
              </button>
            ))}
          </div>
          <div className="journal-subnav">
            <span>
              <Clock3 size={13} />
              时间为规划参考，均按目的地当地时间展示
            </span>
            <button onClick={() => setExpanded(!expanded)}>
              {expanded ? "聚焦这一天" : "展开全部日期"}
              <ChevronRight size={13} />
            </button>
          </div>
          {previewDays.map((day) => {
            const c = cities.find((c) => c.id === day.cityId);
            const first = c.attractions.find(
              (a) => a.id === day.attractionIds?.[0],
            );
            const walk = day.items.find(
              (item) => item.routineType === "citywalk",
            );
            const explorationMinutes =
              (day.visitMinutes || 0) +
              day.items
                .filter((item) => item.routineType === "citywalk")
                .reduce(
                  (sum, item) =>
                    sum + (item.strollMinutes ?? item.durationMinutes),
                  0,
                );
            return (
              <article
                className="journal-day day-card"
                key={`${day.cityId}-${day.day}`}
              >
                <div className="journal-cover">
                  <Photo
                    image={first?.image?.url ? first.image : c.image}
                    alt={first?.image?.url ? first.name : `${c.name}城市参考图`}
                  />
                  {first && !first.image?.url && (
                    <span className="cover-photo-note">
                      城市参考图 · 此景点暂无照片
                    </span>
                  )}
                  <div className="journal-cover-shade" />
                  <div className="journal-cover-content">
                    <span className="cover-kicker">
                      {c.nameEn.toUpperCase()} / {shortDate(day.date)}
                    </span>
                    <h3>
                      <span>
                        Day <b>{String(day.day).padStart(2, "0")}</b>
                      </span>
                      {day.attractionIds?.length
                        ? first?.name
                        : walk
                          ? `${c.name}，慢慢逛`
                          : day.dayWindow?.travelOnly
                            ? "在路上的一天"
                            : "把时间留给" + c.name}
                    </h3>
                    <p>
                      {first?.description ||
                        (walk
                          ? "安顿行李，沿附近的街道认识这座城市。"
                          : c.tagline)}
                    </p>
                  </div>
                  <button
                    className="cover-edit"
                    onClick={() => {
                      setEditingStop(day.stopIndex);
                      setMode("edit");
                    }}
                  >
                    <Settings2 size={14} />
                    调整这一天
                  </button>
                </div>
                <div className="day-at-a-glance">
                  <div>
                    <Clock3 size={16} />
                    <span>
                      当日安排
                      <strong>
                        {day.startTime || "09:00"} <em>—</em>{" "}
                        {day.endTime || "待安排"}
                      </strong>
                    </span>
                  </div>
                  <div>
                    <Compass size={16} />
                    <span>
                      游览与探索
                      <strong>
                        {explorationMinutes
                          ? durationLabel(explorationMinutes)
                          : "暂无安排"}
                      </strong>
                    </span>
                  </div>
                  <div>
                    <Route size={16} />
                    <span>
                      预计在路上
                      <strong>{durationLabel(day.travelMinutes)}</strong>
                    </span>
                  </div>
                  <div>
                    <Wallet size={16} />
                    <span>
                      {day.costs?.missingPrice
                        ? "当日已知活动费用"
                        : "当日活动预算"}
                      <strong>
                        {day.costs?.total == null
                          ? "待核算"
                          : money(day.costs.total, plan.currency)}
                        {day.costs?.missingPrice ? " + 待补充" : ""}
                      </strong>
                    </span>
                  </div>
                </div>
                <div className="day-cost-legend">
                  <span>
                    全员：门票 {money(day.costs?.attractions, plan.currency)}
                  </span>
                  <span>
                    餐饮{" "}
                    {day.costs?.missingCategories?.includes("food")
                      ? "待补充"
                      : money(day.costs?.food, plan.currency)}
                  </span>
                  <span>
                    市内交通{" "}
                    {day.costs?.missingCategories?.includes("transport")
                      ? "待补充"
                      : money(day.costs?.transport, plan.currency)}
                  </span>
                  {(day.costs?.intercity > 0 || day.costs?.transfer > 0) && (
                    <span>
                      城际与接驳{" "}
                      {money(
                        (day.costs?.intercity || 0) +
                          (day.costs?.transfer || 0),
                        plan.currency,
                      )}
                    </span>
                  )}
                  <small>
                    均已计入总预算，不含住宿；跨城费用仅在关联日列一次
                  </small>
                </div>
                {!!day.warnings?.length && (
                  <div className="journal-warnings" role="status">
                    {day.warnings.map((w, i) => (
                      <div className={"journal-warning " + w.severity} key={i}>
                        <TriangleAlert size={16} />
                        <p>{w.message}</p>
                        <button
                          onClick={() => {
                            setEditingStop(day.stopIndex);
                            setMode("edit");
                          }}
                        >
                          去调整
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rich-timeline">
                  {day.items.map((item, i) => (
                    <TimelineItem
                      key={item.id || i}
                      item={item}
                      city={c}
                      plan={plan}
                      rates={rates}
                      onEditLine={onEditLine}
                      samples={priceSamples}
                    />
                  ))}
                </div>
                <div className="day-closing">
                  <span className="closing-line" />
                  <Sun size={15} />
                  <p>不必填满每一分钟，留一点时间给路上的惊喜。</p>
                  <span className="closing-line" />
                </div>
              </article>
            );
          })}
          {!expanded && selected && (
            <div className="journal-pager">
              <button
                disabled={selectedDay === 0}
                onClick={() => setSelectedDay(selectedDay - 1)}
              >
                <ArrowLeft size={15} />
                前一天
              </button>
              <span>
                {String(selectedDay + 1).padStart(2, "0")} /{" "}
                {String(itinerary.length).padStart(2, "0")}
              </span>
              <button
                disabled={selectedDay >= itinerary.length - 1}
                onClick={() => setSelectedDay(selectedDay + 1)}
              >
                后一天
                <ArrowRight size={15} />
              </button>
            </div>
          )}
          <div className="route-method-note">
            <Info size={16} />
            <p>
              城际交通已预留可活动时间，可在上方填写抵达后开始游览与返程前结束的当地时间。预留按距离模型估算，不是实际航班时刻；市内交通使用地理估算，营业、路况和实际班次仍需核对。
            </p>
          </div>
          {expanded && itinerary.length > 60 && (
            <p className="small muted">
              展开模式显示前 60
              天。其余日期可通过上方日期栏逐天查看，导出包含完整行程。
            </p>
          )}
        </>
      )}

      {mode === "edit" && (
        <div className="schedule-editor">
          <div className="editor-intro">
            <span className="editor-icon">
              <GripVertical size={24} />
            </span>
            <div>
              <h3>你的顺序，就是旅程的起点。</h3>
              <p>
                电脑可拖动排序或跨天移动；手机可用箭头和日期选择框调整。生成会保留你的安排。
              </p>
            </div>
          </div>
          <div className="editor-city-tabs" aria-label="选择要规划的城市">
            {plan.stops.map((s, i) => {
              const c = cities.find((c) => c.id === s.cityId);
              return (
                <button
                  key={s.cityId}
                  className={i === safeStop ? "active" : ""}
                  onClick={() => setEditingStop(i)}
                >
                  <Photo image={c.image} alt="" />
                  <span>
                    {c.name}
                    <small>
                      {s.days} 天 · {s.attractionIds.length} 个景点
                    </small>
                  </span>
                  {i === safeStop && <Check size={13} />}
                </button>
              );
            })}
          </div>
          <div className="editor-controls">
            <button
              type="button"
              className="editor-details-toggle"
              data-testid="itinerary-details-toggle"
              aria-expanded={detailsExpanded}
              aria-controls={detailsId}
              onClick={() => setDetailsExpanded((value) => !value)}
            >
              <Settings2 size={14} />
              {detailsExpanded ? "收起细节" : "补充细节"}
              <ChevronDown size={13} />
            </button>
            <div>
              <button
                className="text-button"
                disabled={!undo}
                onClick={undoLast}
              >
                <Undo2 size={13} />
                撤回
              </button>
              <button className="text-button" onClick={() => smartReplan()}>
                <Sparkles size={13} />
                智能重排行程
              </button>
              <button className="text-button" onClick={() => smartReplan(true)}>
                <Plus size={14} />
                补充附近小去处
              </button>
            </div>
          </div>
          <div
            className="editor-extra-fields"
            id={detailsId}
            hidden={!detailsExpanded}
          >
            <label>
              每日开始（07–12点）
              <input
                type="time"
                aria-label="每天出发时间"
                min="07:00"
                max="12:00"
                value={stop.startTime || "09:00"}
                onChange={(e) => {
                  if (
                    /^\d{2}:\d{2}$/.test(e.target.value) &&
                    e.target.value >= "07:00" &&
                    e.target.value <= "12:00"
                  )
                    commit(
                      assignments.map((day) => [...day]),
                      { startTime: e.target.value },
                    );
                }}
              />
            </label>
            <p className="smart-plan-note">
              <Sparkles size={13} />
              按游览时长、地理位置和可活动时间重排；“补充附近小去处”会纳入新收录的免费街区。放不下的地点保留候选，调整可撤回。
            </p>
          </div>
          <div className="editor-status">
            <span>
              <Check size={14} />
              已安排 {assignments.flat().length} / {stop.attractionIds.length}{" "}
              个景点
            </span>
            <span>
              {stopDays.filter((d) =>
                d.warnings?.some((w) => w.severity !== "info"),
              ).length
                ? `${stopDays.filter((d) => d.warnings?.some((w) => w.severity !== "info")).length} 天有规划提示`
                : "当前安排没有明显过满或折返"}
            </span>
          </div>
          {wishlist.length > 0 && (
            <section
              className="itinerary-wishlist"
              aria-label="未安排的候选景点"
            >
              <div className="wishlist-heading">
                <div>
                  <span className="eyebrow">SAVE FOR A LITTLE LATER</span>
                  <h4>
                    候选清单 <span>{wishlist.length}</span>
                  </h4>
                  <p>这些地点尚未排入日程，门票未计入预算。</p>
                </div>
                <label>
                  加入日期
                  <select
                    aria-label="候选景点加入日期"
                    value={Math.min(wishlistDay, assignments.length - 1)}
                    onChange={(e) => setWishlistDay(Number(e.target.value))}
                  >
                    {assignments.map((_, index) => (
                      <option key={index} value={index}>
                        第 {elapsed + index + 1} 天
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="wishlist-places">
                {wishlist.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      add(a.id, Math.min(wishlistDay, assignments.length - 1))
                    }
                    aria-label={`从候选清单添加${a.name}`}
                  >
                    <span>{a.name}</span>
                    <small>
                      {durationLabel(
                        stop.visitDurations?.[a.id] ||
                          getVisitDurationRange(a).recommended,
                      )}
                    </small>
                    <Plus size={13} />
                  </button>
                ))}
              </div>
            </section>
          )}
          <div className="day-board">
            {assignments.slice(0, 60).map((ids, dayIndex) => {
              const d = stopDays.find((d) => d.localDay === dayIndex);
              return (
                <section
                  ref={(el) => {
                    dayRefs.current[dayIndex] = el;
                  }}
                  key={dayIndex}
                  data-day-index={dayIndex}
                  className={
                    "planning-day " +
                    (dropTarget === dayIndex ? "drop-active" : "")
                  }
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDropTarget(dayIndex);
                  }}
                  onDrop={(e) => onDrop(e, dayIndex)}
                >
                  <div className="planning-day-head">
                    <div>
                      <span>
                        DAY {String(elapsed + dayIndex + 1).padStart(2, "0")}
                      </span>
                      <strong>
                        {shortDate(
                          addDays(plan.departureDate, elapsed + dayIndex),
                        )}
                      </strong>
                    </div>
                    <small>{ids.length} 个景点</small>
                  </div>
                  <div className="planning-day-stats">
                    <span>
                      <Compass size={12} />
                      {durationLabel(d?.visitMinutes)}
                    </span>
                    <span>
                      <Route size={12} />
                      {durationLabel(d?.travelMinutes)}
                    </span>
                    <span>{d?.endTime || "自由安排"} 结束</span>
                    <span title="当日门票、餐饮及市内交通，已在总预算中">
                      <Wallet size={12} />
                      {d?.costs?.total == null
                        ? "待核算"
                        : money(d.costs.total, plan.currency)}
                      {d?.costs?.missingPrice ? " + 待补充" : ""}
                    </span>
                  </div>
                  <div className="draggable-list">
                    {ids.map((id, index) => {
                      const a = city.attractions.find((a) => a.id === id);
                      return (
                        <div
                          key={id}
                          data-attraction-id={id}
                          className={
                            "draggable-place " +
                            (dragging === id ? "dragging" : "")
                          }
                          draggable
                          onDragStart={(e) => {
                            setDragging(id);
                            e.dataTransfer.setData("text/plain", id);
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => {
                            setDragging(null);
                            setDropTarget(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDropTarget(dayIndex);
                          }}
                          onDrop={(e) => onDrop(e, dayIndex, index)}
                        >
                          <div className="draggable-main">
                            <span className="drag-handle" title="拖动调整顺序">
                              <GripVertical size={15} />
                            </span>
                            <PlacePhoto attraction={a} city={city} compact />
                            <div>
                              <strong>{a.name}</strong>
                              <small>
                                {a.category || "特色景点"} ·{" "}
                                {durationLabel(
                                  stop.visitDurations?.[id] ||
                                    getVisitDurationRange(a).recommended,
                                )}
                              </small>
                            </div>
                            <div className="place-order-actions">
                              <button
                                className="icon-button"
                                aria-label={`上移${a.name}`}
                                disabled={index === 0}
                                onClick={() => swap(dayIndex, index, -1)}
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                className="icon-button"
                                aria-label={`下移${a.name}`}
                                disabled={index === ids.length - 1}
                                onClick={() => swap(dayIndex, index, 1)}
                              >
                                <ArrowDown size={13} />
                              </button>
                            </div>
                          </div>
                          <DurationEditor
                            attraction={a}
                            minutes={
                              stop.visitDurations?.[id] ||
                              getVisitDurationRange(a).recommended
                            }
                            onChange={(minutes) => changeDuration(id, minutes)}
                          />
                          <div className="draggable-bottom">
                            <span>第 {index + 1} 站</span>
                            <label>
                              移到
                              <select
                                aria-label={`${a.name}安排日期`}
                                value={dayIndex}
                                onChange={(e) =>
                                  move(id, Number(e.target.value))
                                }
                              >
                                {assignments.map((_, di) => (
                                  <option key={di} value={di}>
                                    第 {elapsed + di + 1} 天 ·{" "}
                                    {shortDate(
                                      addDays(plan.departureDate, elapsed + di),
                                    )}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <button
                              className="icon-button remove-place"
                              aria-label={`从行程移除${a.name}`}
                              title="移回候选清单，暂不计入门票预算"
                              onClick={() => remove(id)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {!ids.length && (
                    <div className="empty-planning-day">
                      <Sun size={22} />
                      <p>给这一天留点期待</p>
                      <small>拖入景点，或从下方添加</small>
                    </div>
                  )}
                  <button
                    className="add-to-day"
                    onClick={() => setPickerDay(dayIndex)}
                  >
                    <Plus size={14} />
                    添加景点
                  </button>
                  {!!d?.warnings?.some((w) => w.severity !== "info") && (
                    <div className="planning-warnings">
                      {d.warnings
                        .filter((w) => w.severity !== "info")
                        .map((w, i) => (
                          <div key={i}>
                            <p>
                              <TriangleAlert size={13} />
                              {w.message}
                            </p>
                            {w.suggestedOrder?.length > 1 && (
                              <button
                                onClick={() => {
                                  const next = assignments.map((day) => [
                                    ...day,
                                  ]);
                                  next[dayIndex] = w.suggestedOrder;
                                  commit(next, {}, "已采用较顺路的顺序");
                                }}
                              >
                                采用顺路建议
                                <ArrowRight size={12} />
                              </button>
                            )}
                            {[
                              "busy-day",
                              "busy-arrival",
                              "busy-return",
                              "late-finish",
                              "late-attraction",
                              "after-midnight",
                            ].includes(w.code) &&
                              ids.length > 1 && (
                                <button onClick={() => splitDay(dayIndex)}>
                                  分一些到下一天
                                  <ArrowRight size={12} />
                                </button>
                              )}
                          </div>
                        ))}
                    </div>
                  )}
                  {ids.length > 1 &&
                    !d?.warnings?.some((w) => w.suggestedOrder) && (
                      <button
                        className="optimize-day"
                        onClick={() => {
                          const optimized = optimizeDayRoute(ids, city);
                          const next = assignments.map((day) => [...day]);
                          next[dayIndex] = Array.isArray(optimized)
                            ? optimized
                            : optimized.order || optimized.ids || ids;
                          commit(next, {}, "已检查顺路顺序；第一站保持不变");
                        }}
                      >
                        <Route size={13} />
                        按位置顺路排一排
                      </button>
                    )}
                </section>
              );
            })}
          </div>
          {assignments.length > 60 && (
            <p className="small muted">
              当前工作台展示前 60
              天；移动菜单可安排到后续日期，预览中可逐天查看。
            </p>
          )}
          <div className="editor-bottom">
            <p>
              <Info size={14} />
              路费使用市内交通预算分摊；调换顺序不会重复增加总预算。日期变化后，请再次核对已预约票种。
            </p>
            <button
              className="primary-button"
              onClick={() => {
                setMode("preview");
                setSelectedDay(elapsed);
                setExpanded(false);
                onToast("已按你的景点顺序生成时间线，保留全部手动安排");
              }}
            >
              <Sparkles size={16} />
              按我的安排生成
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
      {pickerDay !== null && (
        <Modal
          title={`第 ${elapsed + pickerDay + 1} 天，再去看看哪里？`}
          onClose={() => setPickerDay(null)}
          wide
        >
          <AttractionPicker
            city={city}
            attractions={unavailable}
            wishlistIds={stop.deferredAttractionIds || []}
            currency={plan.currency}
            rates={rates}
            onAdd={(id) => add(id, pickerDay)}
            onAddCustom={addCustom}
          />
        </Modal>
      )}
    </section>
  );
}

function PlacePhoto({ attraction, city, compact = false }) {
  const hasPhoto = Boolean(attraction.image?.url);
  return (
    <div
      className={
        "place-photo" +
        (!hasPhoto ? " is-reference" : "") +
        (compact ? " compact-photo" : "")
      }
    >
      <Photo
        image={hasPhoto ? attraction.image : undefined}
        alt={attraction.image?.scope && attraction.image.scope !== 'exact-place' ? attraction.image.alt : attraction.name}
      />
    </div>
  );
}

function ImageAttribution({ image }) {
  if (!/^https?:\/\//i.test(image?.sourceUrl || "")) return null;
  return (
    <div className="timeline-photo-credit">
      {image.contextNote && <p>{image.contextNote}</p>}
      <OutLink href={image.sourceUrl}>{image.credit || "图片来源"}</OutLink>
      {/^https?:\/\//i.test(image.licenseUrl || "") && <OutLink href={image.licenseUrl}>{image.license || "图片许可"}</OutLink>}
    </div>
  );
}

function DurationEditor({ attraction, minutes, onChange }) {
  const range = getVisitDurationRange(attraction);
  const [draft, setDraft] = useState(String(minutes));
  const [error, setError] = useState("");
  useEffect(() => {
    setDraft(String(minutes));
    setError("");
  }, [minutes]);
  function applyDraft() {
    const value = Number(draft);
    if (
      !draft.trim() ||
      !Number.isInteger(value) ||
      value < 15 ||
      value > 720
    ) {
      setError("请输入 15–720 的整数分钟");
      return;
    }
    setError("");
    if (value !== minutes) onChange(value);
  }
  const presets = [
    ["走马观花", range.min],
    ["推荐", range.recommended],
    ["细致游览", range.max],
  ];
  return (
    <div
      className="visit-duration-editor"
      draggable={false}
      onDragStart={(e) => e.stopPropagation()}
    >
      <div className="duration-editor-heading">
        <span>
          <Clock3 size={12} /> 停留多久
        </span>
        <small>
          参考 {durationLabel(range.min)}–{durationLabel(range.max)}
        </small>
      </div>
      <div
        className="duration-presets"
        role="group"
        aria-label={`${attraction.name}游览节奏`}
      >
        {presets.map(([label, value]) => (
          <button
            type="button"
            key={label}
            aria-pressed={minutes === value}
            className={minutes === value ? "active" : ""}
            onClick={() => {
              setDraft(String(value));
              setError("");
              if (value !== minutes) onChange(value);
            }}
          >
            <span>{label}</span>
            <small>{durationLabel(value)}</small>
          </button>
        ))}
      </div>
      <label className="duration-input-label">
        <span>自定时长</span>
        <input
          type="number"
          aria-label={`${attraction.name}停留分钟`}
          min="15"
          max="720"
          step="1"
          inputMode="numeric"
          value={draft}
          aria-invalid={Boolean(error)}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          onBlur={applyDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setDraft(String(minutes));
              setError("");
            }
          }}
        />
        <span>分钟</span>
        <small>时间线随之调整</small>
      </label>
      {error && (
        <p className="duration-input-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function AttractionPicker({
  city,
  attractions,
  wishlistIds,
  currency,
  rates,
  onAdd,
  onAddCustom,
}) {
  const [tab, setTab] = useState("catalog");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [wishOnly, setWishOnly] = useState(false);
  const [limit, setLimit] = useState(12);
  const categories = [
    ...new Set(attractions.map((a) => a.category || "特色景点")),
  ];
  const search = query.trim().toLocaleLowerCase();
  const filtered = attractions.filter(
    (a) =>
      (!wishOnly || wishlistIds.includes(a.id)) &&
      (category === "全部" || (a.category || "特色景点") === category) &&
      (!search ||
        [a.name, a.nameEn, a.description, ...(a.features || [])]
          .join(" ")
          .toLocaleLowerCase()
          .includes(search)),
  );
  useEffect(() => setLimit(12), [query, category, wishOnly]);
  return (
    <div className="attraction-library">
      <div className="library-tabs" role="group" aria-label="景点来源">
        <button
          className={tab === "catalog" ? "active" : ""}
          onClick={() => setTab("catalog")}
        >
          <Compass size={15} /> 城市景点库 <small>{attractions.length}</small>
        </button>
        <button
          className={tab === "custom" ? "active" : ""}
          onClick={() => setTab("custom")}
        >
          <Plus size={15} /> 自定义地点
        </button>
      </div>
      {tab === "catalog" ? (
        <>
          <p className="library-intro">
            找一处你感兴趣的地方，加入今天。门票按人数计入预算，游览时长可以继续调整。
          </p>
          <div className="library-search-row">
            <label className="library-search">
              <Search size={17} />
              <input
                type="search"
                autoFocus
                placeholder={`搜索${city.name}景点、大学、街区…`}
                aria-label="搜索可添加的景点"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="library-category">
              <span>分类</span>
              <select
                aria-label="筛选景点分类"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>全部</option>
                {categories.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="library-results-heading">
            <span aria-live="polite">
              找到 <strong>{filtered.length}</strong> 个可添加地点
            </span>
            {wishlistIds.length > 0 && (
              <button
                className={wishOnly ? "active" : ""}
                onClick={() => setWishOnly(!wishOnly)}
                aria-pressed={wishOnly}
              >
                只看候选清单
              </button>
            )}
          </div>
          <div className="schedule-picker">
            {filtered.slice(0, limit).map((a) => {
              const range = getVisitDurationRange(a);
              const price = a.price;
              return (
                <button
                  key={a.id}
                  onClick={() => onAdd(a.id)}
                  aria-label={`添加${a.name}`}
                >
                  <PlacePhoto attraction={a} city={city} compact />
                  <span>
                    <strong>
                      {a.name}
                      {wishlistIds.includes(a.id) && <i>候选</i>}
                    </strong>
                    <small>{featureText(a).join(" · ")}</small>
                    {a.accessNote && (
                      <small className="library-access-note">
                        <TriangleAlert size={11} /> {a.accessNote}
                      </small>
                    )}
                    <em>
                      {durationLabel(range.recommended)} ·{" "}
                      {price?.type === "missing" || price?.missingPrice
                        ? "入场费用待补充"
                        : price?.type === "free"
                          ? "免费开放区域"
                          : price
                            ? `${money(convert(price.low, price.currency || city.currency, currency, rates), currency)}${price.type === "user" ? " / 人·自填" : " / 人起"}`
                            : "票价待核验"}
                    </em>
                  </span>
                  <Plus size={17} />
                </button>
              );
            })}
          </div>
          {filtered.length > limit && (
            <button
              className="library-load-more"
              onClick={() => setLimit(limit + 12)}
            >
              再看 {Math.min(12, filtered.length - limit)} 个地点{" "}
              <ChevronRight size={14} />
            </button>
          )}
          {!filtered.length && (
            <div className="library-empty">
              <Compass size={29} />
              <h4>
                {attractions.length
                  ? "暂时没有匹配的地点"
                  : "景点库中的地点都已安排"}
              </h4>
              <p>试试其他关键词，或把你发现的小店、校园和街区加入计划。</p>
              {(query || category !== "全部" || wishOnly) && (
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("全部");
                    setWishOnly(false);
                  }}
                >
                  清空筛选
                </button>
              )}
              <button onClick={() => setTab("custom")}>
                <Plus size={14} /> 添加自定义地点
              </button>
            </div>
          )}
        </>
      ) : (
        <CustomAttractionForm
          city={city}
          onSubmit={onAddCustom}
          onCancel={() => setTab("catalog")}
        />
      )}
    </div>
  );
}

function CustomAttractionForm({ city, onSubmit, onCancel }) {
  const [values, setValues] = useState({
    name: "",
    description: "",
    duration: "90",
    admission: "0",
    lat: "",
    lng: "",
    sourceUrl: "",
  });
  const [error, setError] = useState("");
  const update = (key) => (event) => {
    setValues((old) => ({ ...old, [key]: event.target.value }));
    setError("");
  };
  function submit(event) {
    event.preventDefault();
    const name = values.name.trim(),
      duration = Number(values.duration),
      admission = Number(values.admission);
    if (!name) {
      setError("请填写地点名称");
      return;
    }
    if (
      !values.duration ||
      !Number.isInteger(duration) ||
      duration < 15 ||
      duration > 720
    ) {
      setError("游览时长应为 15–720 的整数分钟");
      return;
    }
    if (
      !values.admission ||
      !Number.isFinite(admission) ||
      admission < 0 ||
      admission > 10000000
    ) {
      setError("请填写 0–10000000 之间的每人门票金额");
      return;
    }
    const hasCoords = values.lat.trim() !== "" || values.lng.trim() !== "";
    const lat = Number(values.lat),
      lng = Number(values.lng);
    if (
      hasCoords &&
      (!values.lat.trim() ||
        !values.lng.trim() ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180)
    ) {
      setError("坐标请成对填写：纬度 −90–90，经度 −180–180");
      return;
    }
    const sourceUrl = values.sourceUrl.trim();
    if (sourceUrl) {
      try {
        if (new URL(sourceUrl).protocol !== "https:") throw new Error();
      } catch {
        setError("详情链接请填写完整的 https:// 网址");
        return;
      }
    }
    const attraction = {
      id: `custom-${crypto.randomUUID()}`,
      cityId: city.id,
      name,
      nameEn: name,
      description:
        values.description.trim() || "自己发现的地方，按喜欢的节奏慢慢探索。",
      durationHours: duration / 60,
      category: "自定义",
      features: ["我的私藏", "时长可调整"],
      price: {
        low: admission,
        high: admission,
        currency: city.currency,
        type: "user",
        sourceName: "用户填写",
        ...(sourceUrl ? { sourceUrl } : {}),
        checkedAt: new Date().toISOString(),
        note: "用户自行录入的每人门票金额，未进行官方核验。",
      },
      ...(hasCoords ? { lat, lng } : {}),
    };
    if (onSubmit(attraction) === false) setError("暂未保存，请检查表单或重试");
  }
  return (
    <form className="custom-attraction-form" onSubmit={submit}>
      <div className="custom-place-intro">
        <MapPin size={21} />
        <div>
          <h4>把自己的发现，也放进行程。</h4>
          <p>{city.name}的小店、咖啡馆、校园或一个观景角落。</p>
        </div>
      </div>
      <label className="custom-form-wide">
        地点名称
        <input
          required
          maxLength={80}
          autoFocus
          value={values.name}
          onChange={update("name")}
          placeholder="例如：河边的小咖啡馆"
        />
      </label>
      <label className="custom-form-wide">
        想在这里做什么
        <textarea
          maxLength={500}
          rows={3}
          value={values.description}
          onChange={update("description")}
          placeholder="喝杯咖啡、看看建筑，或与朋友见面…"
        />
      </label>
      <div className="custom-form-pair">
        <label>
          游览时长（分钟）
          <input
            required
            type="number"
            min="15"
            max="720"
            step="1"
            value={values.duration}
            onChange={update("duration")}
          />
        </label>
        <label>
          每人门票（{city.currency}）
          <input
            required
            type="number"
            min="0"
            max="10000000"
            step="0.01"
            value={values.admission}
            onChange={update("admission")}
          />
          <small>免费填 0；餐饮消费可在费用明细调整</small>
        </label>
      </div>
      <label className="custom-form-wide">
        详情或预约链接 <span>可选</span>
        <input
          type="url"
          value={values.sourceUrl}
          onChange={update("sourceUrl")}
          placeholder="https://"
        />
      </label>
      <details className="custom-coordinates">
        <summary>
          <Navigation size={14} /> 添加地图坐标 <span>可选</span>
        </summary>
        <p>有坐标才能估算前往这里的路程；未填写时，可手动安排到某一天。</p>
        <div className="custom-form-pair">
          <label>
            纬度
            <input
              type="number"
              min="-90"
              max="90"
              step="any"
              value={values.lat}
              onChange={update("lat")}
              placeholder="例如 39.9042"
            />
          </label>
          <label>
            经度
            <input
              type="number"
              min="-180"
              max="180"
              step="any"
              value={values.lng}
              onChange={update("lng")}
              placeholder="例如 116.4074"
            />
          </label>
        </div>
      </details>
      <p className="custom-photo-note">
        <Info size={13} /> 暂无景点照片时，展示明确标注的城市参考图。
      </p>
      {error && (
        <p role="alert" className="custom-form-error">
          {error}
        </p>
      )}
      <div className="custom-form-actions">
        <button type="button" onClick={onCancel}>
          返回景点库
        </button>
        <button className="primary-button" type="submit">
          <Plus size={15} /> 保存并加入这一天
        </button>
      </div>
    </form>
  );
}

function RoutineItem({ item, city, plan, onEditLine, samples, costText }) {
  const media = getItineraryMedia(item, city);
  const Icon = timelineIcon(item);
  const meal = item.kind === "meal";
  const budgetOnly = !hasTimelineTime(item) && Boolean(item.cost?.budgetLineId);
  const included = item.includedInExperience || item.includedInVisit;
  const cost = item.cost;
  const menu =
    meal &&
    item.mealType === "lunch" &&
    samples.find((sample) => sample.cityId === city.id);
  const mapLink = item.segment?.mapsUrl || item.mapsUrl;
  const costCaption = cost?.missingPrice
    ? "费用尚待补充"
    : included
      ? "已含在原预算中"
      : item.kind === "hotel"
        ? "住宿已计入总预算"
        : cost?.sourceType === "free"
          ? "免费范围"
          : meal
            ? `${plan.travelers} 人餐费预留`
            : "已含在总预算中";
  return (
    <article
      className={`timeline-routine routine-${item.kind}${media ? " has-scene" : ""}`}
    >
      {media && (
        <figure className="timeline-scene">
          <Photo image={media.image} alt={media.alt} />
          <figcaption>
            {media.image?.sourceUrl && (
              <span className="routine-photo-credit">
                <a
                  href={media.image.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={
                    media.image.creditOriginal ||
                    media.image.credit ||
                    "图片来源"
                  }
                >
                  {media.image.credit === "See Wikimedia Commons source page"
                    ? "图片来源"
                    : media.image.credit || "图片来源"}
                </a>
                {media.image.licenseUrl && (
                  <a
                    href={media.image.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="图片按版式裁切，保留原许可证"
                  >
                    {media.image.license}
                  </a>
                )}
              </span>
            )}
          </figcaption>
        </figure>
      )}
      <div className="routine-body">
        <div className="routine-heading">
          <Icon size={17} aria-hidden="true" />
          <h4>{item.title}</h4>
        </div>
        <div className="routine-meta">
          {budgetOnly && <span>{included ? "费用已含" : "灵活安排"}</span>}
          {item.durationMinutes > 0 && (
            <span>
              <Clock3 size={12} />
              {item.journey ? "规划预留 " : "约 "}
              {durationLabel(item.durationMinutes)}
            </span>
          )}
          {item.segment?.distanceKm != null && (
            <span>
              {Number(item.segment.distanceKm).toFixed(1)} km · 路程估算
            </span>
          )}
          {item.routineType === "citywalk" && (
            <span>轻松探索 · 可按体力取舍</span>
          )}
        </div>
        {item.journey &&
        !["arrived", "departed"].includes(item.journeyPhase) ? (
          <details className="routine-description">
            <summary>路程与预算说明</summary>
            <p>{item.description}</p>
          </details>
        ) : (
          <p className="routine-description">{item.description}</p>
        )}
        {!!item.suggestedPlaces?.length && (
          <div className="routine-places" aria-label="附近散步建议">
            {item.suggestedPlaces.map((place) => (
              <div key={place.id || place.name}>
                <strong>
                  <MapPin size={13} />
                  {place.name}
                </strong>
                {place.description && <p>{place.description}</p>}
                {place.mapsUrl && (
                  <OutLink href={place.mapsUrl}>查看位置</OutLink>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="routine-footer">
          {cost?.budgetLineId ? (
            <button
              className={`routine-budget${meal ? " meal-budget" : ""}`}
              title={
                meal
                  ? "调整这座城市的餐饮总预算，三餐会重新分摊"
                  : "查看对应费用明细"
              }
              onClick={() => onEditLine(cost.budgetLineId)}
            >
              <strong>
                {item.kind === "hotel"
                  ? "查看住宿费用"
                  : included
                    ? "不重复计费"
                    : costText}
              </strong>
              <small>{costCaption}</small>
            </button>
          ) : (
            item.routineType === "citywalk" && (
              <span className="routine-cost-note">
                户外散步不另计门票，消费自选
              </span>
            )
          )}
          {mapLink && <OutLink href={mapLink}>查看实际路线</OutLink>}
          {menu && <OutLink href={menu.sourceUrl}>本城菜单参考</OutLink>}
        </div>
      </div>
    </article>
  );
}

function TimelineItem({ item, city, plan, rates, onEditLine, samples }) {
  const attraction = city.attractions.find((a) => a.id === item.attractionId);
  const experience = city.experiences?.find((e) => e.id === item.experienceId);
  const option = experience?.priceOptions.find((o) => o.id === item.optionId);
  const value = item.cost?.amount;
  const costText = item.cost?.missingPrice
    ? "待补充"
    : value == null
      ? "待核实"
      : value === 0 && item.cost?.sourceType === "free"
        ? "免费"
        : money(value, item.cost?.currency || plan.currency);
  const exactCost = item.cost?.sourceType === "user";
  const priceSource = item.cost?.missingPrice
    ? "当地价格待补充"
    : exactCost
      ? attraction?.custom
        ? "自填门票预算"
        : "已录入总价"
      : item.cost?.sourceType === "official"
        ? "官方参考票价"
        : item.cost?.sourceType === "free"
          ? "免费开放范围"
          : attraction
            ? attraction.activityType
              ? "体验预算 · 待核验"
              : "门票估算 · 待核验"
            : "预算分摊";
  const Icon = timelineIcon(item);
  const timed = hasTimelineTime(item);
  return (
    <div
      className={
        "rich-timeline-item kind-" + item.kind + (timed ? "" : " is-untimed")
      }
      data-item-id={item.id}
      data-timing={timed ? "scheduled" : "unscheduled"}
      data-routine-type={item.routineType || ""}
      data-journey-phase={item.journeyPhase || ""}
    >
      <div className="timeline-clock">
        {timed && <strong>{item.time.split("+")[0]}</strong>}
        {timed && item.time.includes("+") && (
          <em>+{item.time.split("+")[1]} 天</em>
        )}
        {timed && item.endTime && item.endTime !== item.time && (
          <small>{item.endTime.replace("+", " +")}</small>
        )}
        <span className="timeline-marker">
          {attraction ? <MapPin size={12} /> : <Icon size={12} />}
        </span>
      </div>
      <div className="timeline-content">
        {attraction ? (
          <article className="timeline-attraction">
            <div className="timeline-attraction-image">
              <PlacePhoto attraction={attraction} city={city} />
              <span>{attraction.category || "城市精选"}</span>
            </div>
            <div className="timeline-attraction-info">
              <div className="timeline-attraction-title">
                <div>
                  <small>{attraction.nameEn}</small>
                  <h4>{attraction.name}</h4>
                </div>
                <span className="visit-duration">
                  <Clock3 size={12} />
                  {durationLabel(
                    item.durationMinutes || attraction.durationHours * 60,
                  )}
                </span>
              </div>
              <p>{attraction.description}</p>
              {attraction.accessNote && (
                <p className="sight-access-note">
                  <TriangleAlert size={13} /> {attraction.accessNote}
                </p>
              )}
              <div className="timeline-features">
                {featureText(attraction).map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              {attraction.bestTime && (
                <p className="best-visit-time">
                  <Sun size={12} />
                  建议时段：{attraction.bestTime}
                </p>
              )}
              {attraction.image?.sourceUrl && (
                <details className="transit-method">
                  <summary>图片与来源</summary>
                  <ImageAttribution image={attraction.image} />
                </details>
              )}
              <div className="timeline-attraction-footer">
                <button
                  className="timeline-price"
                  onClick={() =>
                    item.cost?.budgetLineId &&
                    onEditLine(item.cost.budgetLineId)
                  }
                  disabled={!item.cost?.budgetLineId}
                >
                  <Ticket size={14} />
                  <strong>{costText}</strong>
                  <small>
                    {plan.travelers} 人 · {priceSource}
                  </small>
                </button>
                {attraction.price?.sourceUrl ? (
                  <OutLink href={attraction.price.sourceUrl}>
                    详情 / 预约
                  </OutLink>
                ) : (
                  <span className="source-unavailable">
                    自定义地点 · 详情待补充
                  </span>
                )}
              </div>
            </div>
          </article>
        ) : experience && !item.includedInExperience ? (
          <article className="timeline-attraction timeline-experience">
            <div className="timeline-attraction-image">
              <Photo
                image={experience.image || city.image}
                alt={
                  experience.image?.scope && experience.image.scope !== 'exact-place' ? experience.image.alt : experience.name
                }
              />
            </div>
            <div className="timeline-attraction-info">
              <div className="timeline-attraction-title">
                <div>
                  <small>{experience.provider}</small>
                  <h4>{item.title}</h4>
                </div>
                {item.durationMinutes > 0 && (
                  <span className="visit-duration">
                    <Clock3 size={12} />
                    {durationLabel(item.durationMinutes)}
                  </span>
                )}
              </div>
              <p>{item.description}</p>
              <p className="best-visit-time">
                <MapPin size={12} />
                {experience.address}
              </p>
              <div className="timeline-features">
                {experience.features?.slice(0, 3).map((f) => (
                  <span key={f}>{f}</span>
                ))}
              </div>
              <details className="transit-method">
                <summary>套餐与预订条件</summary>
                <p>{option?.note}</p>
                {option?.includes?.length > 0 && (
                  <p>包含：{option.includes.join("、")}</p>
                )}
                {option?.excludes?.length > 0 && (
                  <p>不含：{option.excludes.join("、")}</p>
                )}
                <p>{experience.availabilityNote}</p>
                <ImageAttribution image={experience.image} />
              </details>
              <div className="timeline-attraction-footer">
                <button
                  className="timeline-price"
                  disabled={!item.cost?.budgetLineId}
                  onClick={() => onEditLine(item.cost.budgetLineId)}
                >
                  <Wallet size={14} />
                  <strong>
                    {experience.kind === "hotel" ? "查看住宿明细" : costText}
                  </strong>
                  <small>
                    {option?.type === "official" ? "官方参考价" : "规划估算"} ·{" "}
                    {experience.kind === "hotel" ? "整站" : "全员"}
                  </small>
                </button>
                <OutLink href={experience.bookingUrl || experience.sourceUrl}>
                  详情 / 预订
                </OutLink>
              </div>
            </div>
          </article>
        ) : (
          <RoutineItem
            item={item}
            city={city}
            plan={plan}
            onEditLine={onEditLine}
            samples={samples}
            costText={costText}
          />
        )}
      </div>
    </div>
  );
}
