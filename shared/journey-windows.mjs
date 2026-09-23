import { resolveJourneyMode, getJourneyModePreference } from './journey-mode.mjs';

const DAY_START = 9 * 60;
const DAY_END = 20 * 60 + 30;
const CAPACITY = DAY_END - DAY_START;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const roundQuarter = (value) => Math.ceil(value / 15) * 15;
const minutesText = (minutes) =>
  `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ""}`;
const validTime = (value) =>
  typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
export const journeyTimeMinutes = (value) =>
  validTime(value)
    ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
    : null;
export const journeyTimeLabel = (value) =>
  `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

/** Validated, serializable local activity boundaries; these are not flight times. */
export function normalizeTransportWindow(value, days) {
  if (!Number.isInteger(Number(days)) || Number(days) < 1 || Number(days) > 365)
    throw new Error("停留天数应为 1–365 的整数");
  if (value === undefined || value === null) return {};
  if (typeof value !== "object" || Array.isArray(value))
    throw new Error("交通时间设置格式无效");
  const normalized = {};
  for (const key of ["arrivalReadyTime", "departureLeaveTime"]) {
    if (value[key] === undefined || value[key] === "") continue;
    if (!validTime(value[key]))
      throw new Error("可活动时间应为 00:00–23:59 的 HH:mm 格式");
    normalized[key] = value[key];
  }
  if (value.arrivalDayOffset !== undefined && value.arrivalDayOffset !== "") {
    if (!["number", "string"].includes(typeof value.arrivalDayOffset))
      throw new Error("抵达日应为本站第 1–15 天");
    const offset = Number(value.arrivalDayOffset);
    if (!Number.isInteger(offset) || offset < 0 || offset > 14)
      throw new Error("抵达日应为本站第 1–15 天");
    normalized.arrivalDayOffset = offset;
  }
  return normalized;
}

function distance(a, b) {
  if (![a?.lat, a?.lng, b?.lat, b?.lng].every(Number.isFinite)) return null;
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) *
      Math.cos(b.lat * r) *
      Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return (
    6371 *
    2 *
    Math.atan2(Math.sqrt(clamp(h, 0, 1)), Math.sqrt(clamp(1 - h, 0, 1)))
  );
}

/** Door-to-door planning reserve, not a schedule, actual route, or guaranteed mode. */
export function estimateJourneyLeg(from, to, legId = "", preferredMode = 'auto') {
  if (!from || !to || from.id === to.id) return null;
  const km = distance(from, to);
  if (km === null) return null;
  const domestic = from.countryCode === to.countryCode;
  const resolution = resolveJourneyMode(from, to, km, preferredMode);
  const mode = resolution.mode;
  let raw, description;
  if (mode === "boat") {
    raw = resolution.reason === 'legacy-mv' ? ((km * 1.2) / 25) * 60 + 90 : ((km * 1.35) / 35) * 60 + 120;
    description = resolution.reason === 'legacy-mv' ? "船程、候船与码头接驳" : "公路接驳、渡船与候船（实际船班待核）";
  } else if (mode === "road") {
    raw = ((km * 1.35) / 50) * 60 + 60;
    description = "公路绕行、取车与途中停顿";
  } else if (resolution.railModel) {
    raw = resolution.railModel.estimatedMinutes;
    description = `${resolution.modeLabel}、候车与两端车站接驳`;
  } else {
    raw =
      (km / 700) * 60 +
      (domestic ? 180 : 240) +
      (from.gatewayTransfer || to.gatewayTransfer ? 90 : 0);
    description = from.airportIsGateway || to.airportIsGateway ? "经门户机场的航空与两端接驳（航班待核）" : "航空距离、提前到场与两端接驳";
  }
  const estimatedMinutes = roundQuarter(Math.max(60, raw));
  return {
    legId,
    fromId: from.id,
    toId: to.id,
    fromName: from.name,
    toName: to.name,
    mode,
    modeLabel: resolution.modeLabel,
    requestedMode: resolution.requestedMode,
    railNetworkId: resolution.railModel?.networkId,
    sourceUrl: resolution.railModel?.sourceUrl,
    routeBasis: resolution.reason,
    fromAirportIsGateway: from.airportIsGateway === true,
    toAirportIsGateway: to.airportIsGateway === true,
    distanceKm: Math.round(km),
    estimatedMinutes,
    reservedMinutes: estimatedMinutes,
    basis: "distance-reserve",
    label: `${from.name} → ${to.name} · ${description}约 ${minutesText(estimatedMinutes)}`,
  };
}

const emptyWindow = () => ({
  startMinute: 0,
  endMinute: 1440,
  maxLocalActiveMinutes: 480,
  reservedMinutes: 0,
  travelOnly: false,
  inbound: null,
  outbound: null,
  note: "",
});
function addNote(window, note) {
  if (note) window.note = [window.note, note].filter(Boolean).join(" ");
}
function allocatedLeg(
  leg,
  reservedMinutes,
  startMinute,
  endMinute,
  basis = "distance-reserve",
) {
  return {
    ...leg,
    reservedMinutes,
    allocatedMinutes: reservedMinutes,
    startMinute,
    endMinute,
    basis,
  };
}
function automaticInbound(windows, leg) {
  let remaining = leg.estimatedMinutes;
  for (const window of windows) {
    if (remaining <= 0) break;
    const allocated = Math.min(CAPACITY, remaining);
    window.inbound = allocatedLeg(
      leg,
      allocated,
      DAY_START,
      DAY_START + allocated,
    );
    window.startMinute = DAY_START + allocated;
    window.endMinute = DAY_END;
    addNote(
      window,
      `入城交通按所选方式预留 ${minutesText(allocated)}；并非已确认的当地发车或起降时刻。`,
    );
    remaining -= allocated;
  }
  if (remaining > 0)
    for (const window of windows)
      addNote(
        window,
        `本站 ${windows.length} 天不足以容纳入城交通，仍有 ${minutesText(remaining)} 未能分配；请延长停留或填写核实后的当地可活动时间。`,
      );
}
function automaticOutbound(windows, leg) {
  let remaining = leg.estimatedMinutes;
  for (let i = windows.length - 1; i >= 0 && remaining > 0; i--) {
    const allocated = Math.min(CAPACITY, remaining);
    const window = windows[i];
    window.outbound = allocatedLeg(
      leg,
      allocated,
      DAY_END - allocated,
      DAY_END,
    );
    window.endMinute = Math.min(window.endMinute, DAY_END - allocated);
    // An automatic return reserve uses a normal local activity day.
    window.startMinute = Math.max(window.startMinute, DAY_START);
    addNote(
      window,
      `返程交通按所选方式预留 ${minutesText(allocated)}，从本站末尾向前分配。`,
    );
    remaining -= allocated;
  }
  if (remaining > 0)
    for (const window of windows)
      addNote(
        window,
        `本站 ${windows.length} 天不足以容纳返程交通，仍有 ${minutesText(remaining)} 未能分配；请增加天数或核实返程前可游览至几点。`,
      );
}
function manualInbound(windows, leg, settings, city) {
  const offset = settings.arrivalDayOffset ?? 0;
  const ready = journeyTimeMinutes(settings.arrivalReadyTime ?? "09:00");
  const base = leg || {
    legId: "",
    fromId: city.id,
    toId: city.id,
    fromName: city.name,
    toName: city.name,
    mode: "local",
    estimatedMinutes: 0,
    label: `${city.name} · 你设置的当地可活动起点`,
  };
  for (let day = 0; day <= Math.min(offset, windows.length - 1); day++) {
    const window = windows[day];
    const beforeArrival = day < offset;
    const allocated = beforeArrival
      ? CAPACITY
      : clamp(ready - DAY_START, 0, CAPACITY);
    window.inbound = allocatedLeg(
      base,
      allocated,
      DAY_START,
      beforeArrival ? DAY_END : clamp(ready, DAY_START, DAY_END),
      "user-local-window",
    );
    window.startMinute = beforeArrival ? DAY_END : ready;
    window.endMinute = DAY_END;
    addNote(
      window,
      beforeArrival
        ? `你设定在本站第 ${offset + 1} 天 ${settings.arrivalReadyTime || "09:00"} 才可开始活动，本日保留给交通。`
        : `按你填写的当地 ${settings.arrivalReadyTime || "09:00"} 开始活动；这不是自动推算的列车或航班抵达时刻。`,
    );
    if (beforeArrival) window.travelOnly = true;
  }
  if (offset >= windows.length)
    for (const window of windows)
      addNote(
        window,
        `抵达日在本站 ${windows.length} 天之外，请增加停留天数或修正抵达日。`,
      );
}

/** Returns perStop[stopIndex][dayIndex]. Reservations never exceed 690 minutes/day. */
export function buildJourneyWindows(plan, cities) {
  const byId = new Map((cities || []).map((city) => [city.id, city]));
  const stops = Array.isArray(plan?.stops) ? plan.stops : [];
  const perStop = [];
  let previous = byId.get(plan?.originId);
  for (let index = 0; index < stops.length; index++) {
    const stop = stops[index],
      city = byId.get(stop.cityId);
    const settings = normalizeTransportWindow(stop.transportWindow, stop.days);
    const windows = Array.from({ length: Number(stop.days) }, emptyWindow);
    const inbound = estimateJourneyLeg(previous, city, `leg-${index}`, getJourneyModePreference(plan, `leg-${index}`, previous, city));
    if (
      city &&
      (settings.arrivalReadyTime !== undefined ||
        settings.arrivalDayOffset !== undefined)
    )
      manualInbound(windows, inbound, settings, city);
    else if (inbound) automaticInbound(windows, inbound);
    if (
      index === stops.length - 1 &&
      plan.returnTrip !== false &&
      plan.mode !== "stay"
    ) {
      const outbound = estimateJourneyLeg(
        city,
        byId.get(plan.originId),
        "leg-return",
        getJourneyModePreference(plan, 'leg-return', city, byId.get(plan.originId)),
      );
      if (outbound && settings.departureLeaveTime !== undefined) {
        const leave = journeyTimeMinutes(settings.departureLeaveTime),
          window = windows.at(-1);
        window.outbound = allocatedLeg(
          outbound,
          clamp(DAY_END - leave, 0, CAPACITY),
          clamp(leave, DAY_START, DAY_END),
          DAY_END,
          "user-local-window",
        );
        window.endMinute = Math.min(window.endMinute, leave);
        addNote(
          window,
          `返程日按你填写的当地 ${settings.departureLeaveTime} 结束游览并出发；车站或机场的提前到场与接驳应包含在你预留的时间内。`,
        );
      } else if (outbound) automaticOutbound(windows, outbound);
    }
    for (const window of windows) {
      const inboundReserve = window.inbound?.reservedMinutes || 0,
        outboundReserve = window.outbound?.reservedMinutes || 0;
      window.reservedMinutes = Math.min(
        CAPACITY,
        inboundReserve + outboundReserve,
      );
      if (
        window.inbound &&
        window.outbound &&
        window.startMinute >= window.endMinute
      )
        addNote(
          window,
          "抵达与返程的活动边界重叠，当天只保留交通；请延长停留或核对实际可活动时间。",
        );
      window.travelOnly =
        window.travelOnly ||
        window.startMinute >= window.endMinute ||
        window.reservedMinutes >= CAPACITY;
      window.endMinute = Math.max(window.startMinute, window.endMinute);
      window.maxLocalActiveMinutes = window.travelOnly
        ? 0
        : Math.min(
            Math.max(0, 480 - window.reservedMinutes),
            window.endMinute - window.startMinute,
          );
      if (window.maxLocalActiveMinutes === 0) {
        window.travelOnly = true;
        if (window.reservedMinutes >= 480 && window.reservedMinutes < CAPACITY)
          addNote(
            window,
            "交通预留已达到每日 8 小时活动负荷，本日余下时间留作休息，不再自动安排景点。",
          );
      }
    }
    perStop.push(windows);
    previous = city;
  }
  return perStop;
}
