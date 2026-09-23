import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ItineraryPlanner from "./ItineraryPlanner.jsx";
import JourneyTransport from "./JourneyTransport.jsx";
import { BudgetPopover, BudgetLineDetails } from "./BudgetDetails.jsx";
import { listJourneyModes, getJourneyModePreference, migrateJourneyTransport } from "../shared/journey-mode.mjs";
import {
  suggestJourneyStop,
  suggestJourneyStops,
} from "../shared/journey-planning.mjs";
import { normalizeTransportWindow } from "../shared/journey-windows.mjs";
import { buildDayAssignments } from "../shared/itinerary.mjs";
import {
  PROJECT_STORAGE_KEY,
  createProjectRecord,
  hydrateProjects,
} from "../shared/projects.mjs";
import { ProjectBar, ProjectForm, ProjectsModal } from "./Projects.jsx";
import CostPreferences from "./CostPreferences.jsx";
import CityHome from "./CityHome.jsx";
import AirportCityHome from "./AirportCityHome.jsx";
import HeroCarousel from "./HeroCarousel.jsx";
import { apiFetch } from "./api.mjs";
import CountryTripPlanner from "./CountryTripPlanner.jsx";
import CurrencySelect from "./CurrencySelect.jsx";
import DestinationGallery from "./DestinationGallery.jsx";
import { CountryFlag } from "./DestinationSelect.jsx";
import { preserveUnchangedQuotes } from "../shared/quote-preservation.mjs";
import { mergeAirportCities } from "../shared/airport-catalog.mjs";
import { createRecommendedStop, getTripDuration, recommendedDays } from "../shared/trip-duration.mjs";
const LivingPage = lazy(() => import("./LivingPage.jsx"));
const GlobePage = lazy(() => import("./GlobePage.jsx"));
import {
  applyExperienceSelection,
  resolveExperienceSelections,
  experienceLineId,
} from "../shared/experiences.mjs";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Compass,
  Database,
  ExternalLink,
  FileDown,
  Globe2,
  Heart,
  Info,
  Leaf,
  Map,
  MapPin,
  Menu,
  Minus,
  Plane,
  TrainFront,
  Ship,
  Car,
  Plus,
  RefreshCw,
  Route,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Ticket,
  Trash2,
  Users,
  Utensils,
  Wallet,
  X,
} from "lucide-react";
import {
  calculatePlan,
  generateItinerary,
  bookingLinks,
  mergeCustomAttractions,
} from "../shared/planner.mjs";
import {
  CURRENCIES,
  Photo,
  OutLink,
  Modal,
  CityPicker,
  LineEditor,
  money,
  convert,
  addDays,
  shortDate,
  safeRead,
  persist,
  download,
} from "./ui.jsx";

const TIERS = [
  {
    name: "轻装出发",
    en: "ESSENTIAL",
    description: "住得简单，玩得尽兴",
    icon: Leaf,
  },
  {
    name: "舒适刚好",
    en: "COMFORT",
    description: "好好休息，也好好体验",
    icon: Sun,
  },
  {
    name: "尽兴享受",
    en: "PREMIUM",
    description: "为难得的体验多留一点",
    icon: Sparkles,
  },
];
const CAT_ICONS = {
  intercity: Route,
  transfer: Route,
  reserve: ShieldCheck,
  connectivity: Globe2,
  visa: ShieldCheck,
  flights: Plane,
  flight: Plane,
  transport: Route,
  lodging: BedDouble,
  accommodation: BedDouble,
  rent: BedDouble,
  food: Utensils,
  attractions: Ticket,
  experiences: Sparkles,
  attraction: Ticket,
  misc: Wallet,
  insurance: ShieldCheck,
  transfers: Route,
  utilities: Sun,
};
const CAT_COLORS = [
  "#4c6958",
  "#bdc999",
  "#deb881",
  "#879fa0",
  "#aca0ba",
  "#c7b8a6",
  "#799477",
  "#d39e80",
];
function defaultPlan(cities) {
  const departureDate = addDays(new Date().toISOString().slice(0, 10), 30);
  const next = {
    originId: "shanghai",
    plannerVersion: 2,
    transportModelVersion: 2,
    transportModes: {},
    customAttractions: [],
    stops: [
      {
        cityId: "tokyo",
        days: recommendedDays('tokyo'),
        daysSource: 'recommendation',
        attractionIds:
          cities.find((c) => c.id === "tokyo")?.attractions.map((a) => a.id) ||
          [],
      },
      {
        cityId: "kyoto",
        days: recommendedDays('kyoto'),
        daysSource: 'recommendation',
        attractionIds:
          cities.find((c) => c.id === "kyoto")?.attractions.map((a) => a.id) ||
          [],
      },
    ],
    departureDate,
    travelers: 2,
    rooms: 1,
    currency: "CNY",
    mode: "travel",
    tier: 1,
    returnTrip: true,
    reservePercent: 10,
    overrides: {},
  };
  next.stops = suggestJourneyStops(next, cities);
  return next;
}
function restoreTransportWindow(value, days) {
  try {
    return normalizeTransportWindow(
      value,
      Math.max(1, Math.min(365, Math.round(Number(days) || 3))),
    );
  } catch {
    return {};
  }
}
function normalizePlan(p, cities) {
  const base = defaultPlan(cities);
  if (!p || typeof p !== "object") return base;
  cities = mergeCustomAttractions(cities, p.customAttractions);
  const customAttractions = cities.flatMap((c) =>
    c.attractions
      .filter((a) => a.id.startsWith("custom-"))
      .map((a) => ({ ...a, cityId: c.id })),
  );
  const validId = (id) => cities.some((c) => c.id === id);
  const stops = Array.isArray(p.stops)
    ? p.stops
        .filter((s) => s && validId(s.cityId))
        .slice(0, 8)
        .map((s) => ({
          cityId: s.cityId,
          planningMode: s.planningMode === "smart" ? "smart" : "manual",
          transportWindow: restoreTransportWindow(s.transportWindow, s.days),
          smartPlan:
            s.smartPlan && typeof s.smartPlan === "object"
              ? s.smartPlan
              : undefined,
          requestedAttractionIds: Array.isArray(s.requestedAttractionIds)
            ? s.requestedAttractionIds.filter(id => cities.find(c => c.id === s.cityId)?.attractions.some(a => a.id === id))
            : [],
          experienceSelections: Array.isArray(s.experienceSelections)
            ? s.experienceSelections
                .filter((entry) => {
                  const place = cities
                    .find((c) => c.id === s.cityId)
                    ?.experiences?.find((e) => e.id === entry?.experienceId);
                  return place?.priceOptions?.some(
                    (o) => o.id === entry.optionId,
                  );
                })
                .slice(0, 1000)
                .map((entry) => ({
                  experienceId: entry.experienceId,
                  optionId: entry.optionId,
                  dayIndex: Math.max(
                    0,
                    Math.min(
                      (Number(s.days) || 3) - 1,
                      Math.round(Number(entry.dayIndex) || 0),
                    ),
                  ),
                  ...(entry.mealType ? { mealType: entry.mealType } : {}),
                  ...(entry.scheduleStatus === "needs-more-days"
                    ? { scheduleStatus: entry.scheduleStatus }
                    : {}),
                }))
            : [],
          days: Math.max(1, Math.min(365, Math.round(Number(s.days) || recommendedDays(cities.find(c => c.id === s.cityId))))),
          daysSource: s.daysSource === 'recommendation' ? 'recommendation' : 'user',
          visitDurations: Object.fromEntries(
            Object.entries(s.visitDurations || {}).filter(
              ([id, minutes]) =>
                Number.isInteger(minutes) && minutes >= 15 && minutes <= 720,
            ),
          ),
          dailyPreferences: Object.fromEntries(
            Object.entries(s.dailyPreferences || {}).filter(
              ([key, amount]) =>
                ["lodging", "food", "transport"].includes(key) &&
                Number.isFinite(amount) &&
                amount >= 0 &&
                amount <= 1e7,
            ),
          ),
          deferredAttractionIds: Array.isArray(s.deferredAttractionIds)
            ? s.deferredAttractionIds.filter((id) =>
                cities
                  .find((c) => c.id === s.cityId)
                  .attractions.some((a) => a.id === id),
              )
            : [],
          dayPlans: Array.isArray(s.dayPlans)
            ? s.dayPlans
                .slice(0, 365)
                .map((day) =>
                  Array.isArray(day)
                    ? day.filter((id) => typeof id === "string")
                    : [],
                )
            : undefined,
          startTime: /^(?:0[7-9]|1[0-1]):[0-5]\d$|^12:00$/.test(
            s.startTime || "",
          )
            ? s.startTime
            : "09:00",
          attractionIds: Array.isArray(s.attractionIds)
            ? s.attractionIds.filter((id) =>
                cities
                  .find((c) => c.id === s.cityId)
                  .attractions.some((a) => a.id === id),
              )
            : [],
        }))
    : base.stops;
  p = { ...p, ...migrateJourneyTransport({ ...p, originId: validId(p.originId) ? p.originId : base.originId, stops }, cities) };
  const departureDate =
    /^\d{4}-\d{2}-\d{2}$/.test(p.departureDate) &&
    !isNaN(Date.parse(p.departureDate)) &&
    new Date(p.departureDate + "T12:00:00Z").toISOString().slice(0, 10) ===
      p.departureDate
      ? p.departureDate
      : base.departureDate;
  const travelers = Math.max(
    1,
    Math.min(20, Math.round(Number(p.travelers) || 2)),
  );
  let remaining = 730;
  let elapsedDays = 0;
  const cleanStops = stops
    .filter((s, i) => stops.findIndex((x) => x.cityId === s.cityId) === i)
    .map((s, i, all) => {
      const days = Math.min(s.days, remaining - (all.length - i - 1));
      remaining -= days;
      elapsedDays += days;
      const next = { ...s, days };
      const city = cities.find((c) => c.id === s.cityId);
      next.experienceSelections = resolveExperienceSelections(next, city).map(
        (row) => row.selection,
      );
      // Repair legacy automatic plans that had no feasible schedule. New manual plans retain user control.
      if (
        p.plannerVersion !== 2 &&
        (!next.dayPlans ||
          next.attractionIds.reduce(
            (n, id) =>
              n +
              (city.attractions.find((a) => a.id === id)?.durationHours || 2),
            0,
          ) >
            days * 7)
      )
        return suggestJourneyStop(
          {
            ...base,
            ...p,
            originId: validId(p.originId) ? p.originId : base.originId,
            departureDate,
            stops: stops.map((s, index) => (index === i ? next : s)),
          },
          cities,
          i,
        );
      return next;
    });
  return {
    ...base,
    ...p,
    plannerVersion: 2,
    customAttractions,
    originId: validId(p.originId) ? p.originId : base.originId,
    stops: cleanStops.length ? cleanStops : base.stops,
    departureDate,
    travelers,
    rooms: Math.max(1, Math.min(travelers, Math.round(Number(p.rooms) || 1))),
    currency: CURRENCIES[p.currency] ? p.currency : "CNY",
    mode: p.mode === "stay" ? "stay" : "travel",
    tier: [0, 1, 2].includes(p.tier) ? p.tier : 1,
    reservePercent: Math.max(0, Math.min(50, Number(p.reservePercent) || 0)),
    returnTrip: p.returnTrip !== false,
    overrides: Object.fromEntries(
      Object.entries(p.overrides || {}).filter(
        ([k, v]) =>
          v && Number.isFinite(v.amount) && v.amount >= 0 && v.amount <= 1e9,
      ),
    ),
  };
}

function readRoute(hash) {
  const city = hash.match(/^#\/city\/([a-z0-9-]+)$/);
  if (city) return { view: "city", cityId: city[1] };
  const view = hash.replace(/^#\//, "");
  return {
    view: ["planner", "explore", "stay", "globe", "sources"].includes(view)
      ? view
      : "planner",
  };
}

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectReady, setProjectReady] = useState(false);
  const [view, setView] = useState(() => readRoute(window.location.hash).view);
  const [moduleCurrency, setModuleCurrency] = useState(() => {
    const stored = safeRead("tusuan-display-currency", null);
    return Object.hasOwn(CURRENCIES, stored) ? stored : null;
  });
  const [homeCityId, setHomeCityId] = useState(
    () => window.location.hash.split("/")[2] || "beijing",
  );
  const [tab, setTab] = useState("overview");
  const [costFilter, setCostFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [activeStop, setActiveStop] = useState(0);
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(() => safeRead("tusuan-saved", []));
  const [mobileNav, setMobileNav] = useState(false);
  const [sightQuery, setSightQuery] = useState("");
  const [showAllSights, setShowAllSights] = useState(false);
  const [compare, setCompare] = useState([]);
  const [status, setStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const importRef = useRef(null);
  async function load() {
    setError("");
    try {
      const r = await apiFetch("/api/catalog");
      if (!r.ok) throw Error("服务暂时不可用");
      const data = await r.json();
      if (!data.cities?.length) throw Error("城市数据库尚未准备好");
      setCatalog(data);
      const availableCities = mergeAirportCities(data.cities, data.airportCities || []);
      const workspace = hydrateProjects(
        safeRead(PROJECT_STORAGE_KEY, null),
        safeRead("tusuan-current", null),
        safeRead("tusuan-saved", []),
        (p) => normalizePlan(p, availableCities),
        (p) =>
          p.stops
            .map((s) => availableCities.find((c) => c.id === s.cityId)?.name)
            .join(" · ") + "之旅",
      );
      setProjects(workspace.projects);
      setActiveProjectId(workspace.activeId);
      setPlan(workspace.projects.find((p) => p.id === workspace.activeId).plan);
      setProjectReady(true);
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const syncRoute = () => {
      const route = readRoute(window.location.hash);
      if (route.cityId) setHomeCityId(route.cityId);
      setView(route.view);
      setMobileNav(false);
    };
    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);
  useEffect(() => {
    if (plan) persist("tusuan-current", plan);
  }, [plan]);
  useEffect(() => {
    if (!projectReady || !plan || !activeProjectId) return;
    setProjects((previous) =>
      previous.map((p) =>
        p.id === activeProjectId
          ? { ...p, plan, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
  }, [plan, activeProjectId, projectReady]);
  useEffect(() => {
    if (!projectReady || !projects.length) return;
    if (
      !persist(PROJECT_STORAGE_KEY, {
        version: 1,
        activeId: activeProjectId,
        projects,
      })
    )
      setToast("浏览器存储空间不足，请导出当前项目备份");
  }, [projects, activeProjectId, projectReady]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (view === "sources") refreshStatus();
  }, [view]);
  useEffect(() => {
    if (view !== "city") window.history.replaceState(null, "", `#/${view}`);
  }, [view]);
  useEffect(() => {
    setSightQuery("");
    setShowAllSights(false);
  }, [activeStop, activeProjectId]);
  async function refreshStatus() {
    setStatusLoading(true);
    try {
      const r = await apiFetch("/api/data-status");
      if (!r.ok) throw Error();
      setStatus(await r.json());
    } catch {
      setToast("数据状态读取失败，请稍后重试");
    } finally {
      setStatusLoading(false);
    }
  }
  const catalogCities = useMemo(() => mergeAirportCities(catalog?.cities || [], catalog?.airportCities || []), [catalog]);
  const detailedCities = catalog?.cities || [];
  const cities = useMemo(
    () =>
      mergeCustomAttractions(catalogCities, plan?.customAttractions),
    [catalogCities, plan?.customAttractions],
  );
  const rates = catalog?.rates;
  const budget = useMemo(() => {
    if (!plan || !catalog) return null;
    try {
      return calculatePlan(plan, cities, rates);
    } catch (e) {
      return { error: e.message };
    }
  }, [plan, catalog]);
  const itinerary = useMemo(() => {
    if (!plan || !catalog) return [];
    try {
      return generateItinerary(plan, cities, rates);
    } catch {
      return [];
    }
  }, [plan, catalog]);
  if (!catalog || !plan)
    return (
      <main className="boot">
        <Compass size={46} />
        <h1>途算</h1>
        <p>{error || "正在展开你的世界地图…"}</p>
        {error ? (
          <button className="primary-button" onClick={load}>
            重新连接
          </button>
        ) : (
          <span className="loading-line" />
        )}
        <small>TRAVEL WITH A LITTLE MORE CLARITY.</small>
      </main>
    );
  const cityById = (id) => cities.find((c) => c.id === id);
  const stop = plan.stops[Math.min(activeStop, plan.stops.length - 1)];
  const city = cityById(stop.cityId);
  const origin = cityById(plan.originId);
  const totalDays = plan.stops.reduce((s, c) => s + c.days, 0);
  const availableCurrencies = Object.keys(CURRENCIES).filter(
    (c) => rates?.rates?.[c],
  );
  const lines = budget?.lines || [];
  const confirmedLines = lines.filter((l) => l.confirmed);
  const confirmedAmount = confirmedLines.reduce((s, l) => s + l.amount, 0);
  const categories = budget?.categories || [];
  const editBudgetLine = (id) => { const line = lines.find((item) => item.id === id); if (line) { window.dispatchEvent(new CustomEvent('budget-detail-open', { detail: 'line-editor' })); setModal({ type: 'line', line }); } };
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const sourceCount = cities
    .flatMap((c) => c.attractions)
    .filter((a) => a.price.type === "official").length;
  function change(patch, { keep = false } = {}) {
    if (patch.stops?.reduce((sum, s) => sum + s.days, 0) > 730) {
      setToast("完整行程最多支持 730 天");
      return false;
    }
    if (patch.travelers !== undefined)
      patch.rooms = Math.min(plan.rooms, patch.travelers);
    if (patch.rooms !== undefined)
      patch.rooms = Math.min(patch.rooms, patch.travelers ?? plan.travelers);
    if (patch.travelers !== undefined) {
      try {
        plan.stops.forEach((s) =>
          resolveExperienceSelections(s, cityById(s.cityId), {
            travelers: patch.travelers,
          }),
        );
      } catch (error) {
        setToast(error.message);
        return false;
      }
    }
    const routeChanged =
      (patch.originId !== undefined && patch.originId !== plan.originId) ||
      (patch.returnTrip !== undefined &&
        patch.returnTrip !== plan.returnTrip) ||
      (patch.departureDate !== undefined &&
        patch.departureDate !== plan.departureDate) ||
      (patch.stops &&
        patch.stops.map((s) => `${s.cityId}:${s.days}`).join("|") !==
          plan.stops.map((s) => `${s.cityId}:${s.days}`).join("|"));
    if (routeChanged) {
      try {
        patch.stops = suggestJourneyStops({ ...plan, ...patch }, cities, {
          automaticOnly: true,
        });
      } catch (error) {
        setToast(error.message);
        return false;
      }
    }
    if (!keep && Object.keys(plan.overrides).length)
      setToast("行程条件已变化，已录入费用恢复为参考预算，请重新核对");
    setPlan((p) => ({ ...p, ...patch, overrides: keep ? p.overrides : {} }));
    return true;
  }
  function changeCurrency(currency) {
    const factor = convert(1, plan.currency, currency, rates);
    setPlan((p) => ({
      ...p,
      currency,
      overrides: Object.fromEntries(
        Object.entries(p.overrides).map(([k, v]) => [
          k,
          { ...v, amount: Math.round(v.amount * factor * 100) / 100 },
        ]),
      ),
    }));
  }
  function updateStop(index, patch) {
    try {
      const previous = plan.stops[index];
      let next = { ...previous, ...patch };
      if (patch.days !== undefined) next.daysSource = patch.daysSource || 'user';
      if (patch.dayPlans && !patch.smartPlan) next.planningMode = "manual";
      const autoResize =
        patch.days !== undefined &&
        patch.days !== previous.days &&
        patch.dayPlans === undefined;
      if (autoResize) {
        next = suggestJourneyStop(
          {
            ...plan,
            stops: plan.stops.map((item, i) => (i === index ? next : item)),
          },
          cities,
          index,
        );
      }
      if (next.dayPlans)
        next.dayPlans = buildDayAssignments(next, cityById(next.cityId));
      const experienceChanged =
        JSON.stringify(previous.experienceSelections || []) !==
        JSON.stringify(next.experienceSelections || []);
      if (
        experienceChanged &&
        previous.days === next.days &&
        previous.cityId === next.cityId
      ) {
        const before = resolveExperienceSelections(
          previous,
          cityById(previous.cityId),
        );
        const after = resolveExperienceSelections(next, cityById(next.cityId));
        const changed = [
          ...before.filter(
            (row) =>
              !after.some(
                (other) =>
                  JSON.stringify(row.selection) ===
                  JSON.stringify(other.selection),
              ),
          ),
          ...after.filter(
            (row) =>
              !before.some(
                (other) =>
                  JSON.stringify(row.selection) ===
                  JSON.stringify(other.selection),
              ),
          ),
        ];
        const invalidated = new Set(
          changed.map((row) =>
            experienceLineId(index, row.selection, row.experience.kind),
          ),
        );
        if (
          changed.some(
            (row) =>
              row.experience.kind === "restaurant" || row.includedMeals.length,
          )
        )
          invalidated.add(`stop-${index}-food`);
        previous.attractionIds
          .filter((id) => !next.attractionIds.includes(id))
          .forEach((id) => invalidated.add(`stop-${index}-attraction-${id}`));
        setPlan((p) => ({
          ...p,
          stops: p.stops.map((s, i) => (i === index ? next : s)),
          overrides: Object.fromEntries(
            Object.entries(p.overrides).filter(([id]) => !invalidated.has(id)),
          ),
        }));
        return true;
      }
      const sameCosts =
        previous.days === next.days &&
        previous.cityId === next.cityId &&
        JSON.stringify(previous.experienceSelections || []) ===
          JSON.stringify(next.experienceSelections || []) &&
        [...previous.attractionIds].sort().join("|") ===
          [...next.attractionIds].sort().join("|");
      // Scenic edits do not invalidate a booked hotel, flight or food budget.
      if (
        !sameCosts &&
        previous.days === next.days &&
        previous.cityId === next.cityId &&
        JSON.stringify(previous.experienceSelections || []) ===
          JSON.stringify(next.experienceSelections || [])
      ) {
        const removed = previous.attractionIds.filter(
          (id) => !next.attractionIds.includes(id),
        );
        setPlan((p) => ({
          ...p,
          stops: p.stops.map((s, i) => (i === index ? next : s)),
          overrides: Object.fromEntries(
            Object.entries(p.overrides).filter(
              ([id]) =>
                !removed.some(
                  (sight) => id === `stop-${index}-attraction-${sight}`,
                ),
            ),
          ),
        }));
        return true;
      }
      const applied = change(
        { stops: plan.stops.map((s, i) => (i === index ? next : s)) },
        { keep: sameCosts },
      );
      if (applied && autoResize)
        setToast(
          `已按 ${next.days} 天重新精选 ${next.attractionIds.length} 个景点${next.deferredAttractionIds?.length ? `，其余 ${next.deferredAttractionIds.length} 个保留在候选清单` : ""}${Object.keys(plan.overrides).length ? "；天数变化，已录入费用需重新核对" : ""}`,
        );
      return applied;
    } catch (error) {
      setToast(error.message);
      return false;
    }
  }
  function setDailyPreferences(index, dailyPreferences) {
    const old = plan.stops[index].dailyPreferences || {};
    const changed = ["lodging", "food", "transport"].filter(
      (k) => old[k] !== dailyPreferences[k],
    );
    setPlan((p) => ({
      ...p,
      stops: p.stops.map((s, i) =>
        i === index ? { ...s, dailyPreferences } : s,
      ),
      overrides: Object.fromEntries(
        Object.entries(p.overrides).filter(
          ([id]) => !changed.some((k) => id === `stop-${index}-${k}`),
        ),
      ),
    }));
    setToast("已更新消费偏好，日常预算和每日行程同步计算");
  }
  function setTransportWindow(index, transportWindow) {
    const previous = plan.stops[index];
    const next = {
      ...previous,
      transportWindow: normalizeTransportWindow(transportWindow, previous.days),
    };
    if (previous.planningMode === "smart") {
      const nextPlan = {
        ...plan,
        stops: plan.stops.map((stop, i) => (i === index ? next : stop)),
      };
      if (updateStop(index, suggestJourneyStop(nextPlan, cities, index)))
        setToast("已按交通预留时间重新精选；未排入景点保留在候选清单");
    } else if (updateStop(index, next))
      setToast("已更新交通时间；手动景点保留，请检查冲突或使用智能重排");
  }
  function setTransportMode(legId, mode) {
    const leg = budget?.legs?.find((item) => item.id === legId);
    if (!leg) return;
    const from = cityById(leg.fromId), to = cityById(leg.toId);
    if (!from || !to || (mode !== 'auto' && !listJourneyModes(from, to, leg.distanceKm).some((item) => item.mode === mode))) return;
    if (getJourneyModePreference(plan, legId, from, to) === mode) return;
    try {
      const transportModes = { ...(plan.transportModes || {}) };
      if (mode === 'auto') delete transportModes[legId];
      else transportModes[legId] = { fromId: from.id, toId: to.id, mode };
      const isReturn = legId === 'leg-return';
      const affected = isReturn ? plan.stops.length - 1 : Number(legId.replace('leg-', ''));
      let clearedTime = false;
      let next = { ...plan, transportModes, stops: plan.stops.map((stop, index) => {
        if (index !== affected) return stop;
        const transportWindow = { ...(stop.transportWindow || {}) };
        for (const key of isReturn ? ['departureLeaveTime'] : ['arrivalReadyTime', 'arrivalDayOffset']) {
          if (transportWindow[key] !== undefined) clearedTime = true;
          delete transportWindow[key];
        }
        return { ...stop, transportWindow };
      }) };
      next.stops = suggestJourneyStops(next, cities, { automaticOnly: true });
      const retained = preserveUnchangedQuotes(plan, next, cities, rates);
      setPlan({ ...next, overrides: retained.overrides });
      setToast(`交通方式已更新，路费与可游览时间同步计算${retained.resetIds.length ? '；受影响费用需重新核对' : ''}${clearedTime ? '；原段已订时间已恢复自动预留' : ''}`);
    } catch (error) { setToast(error.message || '交通方式暂未更新，请稍后再试'); }
  }
  function addCustomAttraction(index, attraction, dayIndex) {
    const previous = plan.stops[index];
    try {
      const customs = [
        ...(plan.customAttractions || []),
        { ...attraction, cityId: previous.cityId },
      ];
      const merged = mergeCustomAttractions(catalogCities, customs);
      const targetCity = merged.find((c) => c.id === previous.cityId);
      if (!targetCity.attractions.some((a) => a.id === attraction.id))
        throw Error("请检查名称、票价和游览时间");
      const dayPlans = buildDayAssignments(previous, targetCity);
      dayPlans[Math.max(0, Math.min(previous.days - 1, dayIndex))].push(
        attraction.id,
      );
      const next = {
        ...previous,
        attractionIds: [...previous.attractionIds, attraction.id],
        dayPlans,
      };
      setPlan((p) => ({
        ...p,
        customAttractions: customs,
        stops: p.stops.map((s, i) => (i === index ? next : s)),
      }));
      setToast("自定义地点已加入本项目，预算与时间已同步");
      return true;
    } catch (e) {
      setToast(e.message);
      return false;
    }
  }
  function openProject(id) {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    setActiveProjectId(id);
    setPlan(normalizePlan(target.plan, catalogCities));
    setActiveStop(0);
    setModal(null);
    setView("planner");
  }
  function appendProject(name, newPlan) {
    if (projects.length >= 50) {
      setToast("最多保留 50 个旅行项目，请先导出并整理旧项目");
      return false;
    }
    const record = createProjectRecord(name, newPlan);
    setProjects((previous) => [
      ...previous.map((p) => (p.id === activeProjectId ? { ...p, plan } : p)),
      record,
    ]);
    setActiveProjectId(record.id);
    setPlan(record.plan);
    setActiveStop(0);
    setModal(null);
    setView("planner");
    setTab("overview");
    return true;
  }
  function createProject({ name, cityId, days, daysSource = 'user', countryDraft }) {
    if (countryDraft) {
      const next = { ...defaultPlan(catalogCities), originId: countryDraft.originId, departureDate: countryDraft.planDepartureDate || countryDraft.departureDate, returnTrip: countryDraft.returnTrip, currency: plan.currency, tier: plan.tier, travelers: plan.travelers, rooms: plan.rooms, mode: 'travel', stops: countryDraft.stops, transportModes: countryDraft.transportModes || {}, transportModelVersion: 2 };
      if (appendProject(name.trim() || `${countryDraft.countryName} · ${countryDraft.totalDays} 日之旅`, next)) setToast('国家路线已建立，可继续调整城市和景点');
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setToast("停留天数应为 1 至 365 天");
      return;
    }
    const destination = catalogCities.find((c) => c.id === cityId);
    const base = defaultPlan(catalogCities);
    const next = {
      ...base,
      originId: plan.originId,
      currency: plan.currency,
      stops: [
        {
          cityId,
          days,
          daysSource,
          attractionIds: destination.attractions.map((a) => a.id),
        },
      ],
    };
    next.stops = suggestJourneyStops(next, cities);
    if (
      appendProject(name.trim() || `${destination.name} · ${days} 日之旅`, next)
    )
      setToast("新项目已建立，其他旅行项目已独立保留");
  }
  function duplicateProject(id) {
    const source = projects.find((p) => p.id === id);
    if (
      source &&
      appendProject(
        source.name + " · 副本",
        id === activeProjectId ? plan : source.plan,
      )
    )
      setToast("已复制为独立项目，可以尝试另一种安排");
  }
  function deleteProject(id) {
    if (projects.length <= 1) return;
    const remaining = projects.filter((p) => p.id !== id);
    setProjects(remaining);
    if (id === activeProjectId) {
      setActiveProjectId(remaining[0].id);
      setPlan(normalizePlan(remaining[0].plan, catalogCities));
      setActiveStop(0);
    }
    setToast("项目已删除");
  }
  function toggleAttraction(id) {
    const removing = stop.attractionIds.includes(id);
    const ids = stop.attractionIds.includes(id)
      ? stop.attractionIds.filter((x) => x !== id)
      : [...stop.attractionIds, id];
    const requestedAttractionIds = removing
      ? (stop.requestedAttractionIds || []).filter(value => value !== id)
      : [...new Set([...(stop.requestedAttractionIds || []), id])];
    updateStop(activeStop, { attractionIds: ids, requestedAttractionIds });
  }
  function navigate(next) {
    window.location.hash = `/${next}`;
    setView(next);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function openCityHome(id) {
    if (!cityById(id)) return;
    window.location.hash = `/city/${id}`;
    setHomeCityId(id);
    setView("city");
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function generateCityPlan(draft) {
    try {
      const destination = cityById(draft.cityId);
      if (!destination) throw Error("城市资料暂不可用");
      let index = plan.stops.findIndex((s) => s.cityId === draft.cityId);
      if (index < 0) {
        if (plan.stops.length >= 8)
          throw Error("最多支持 8 个目的地，请先调整路线");
        index = plan.stops.length;
      }
      const previous = plan.stops[index];
      const days = Math.max(
        1,
        Math.min(365, Math.round(Number(draft.days) || recommendedDays(destination))),
      );
      let selected = {
        ...(previous || {}),
        cityId: draft.cityId,
        days,
        daysSource: draft.daysSource || 'user',
        attractionIds: [...new Set(draft.attractionIds || [])],
        requestedAttractionIds: [],
        deferredAttractionIds: [],
        dayPlans: undefined,
        experienceSelections: [],
      };
      for (const entry of draft.experienceSelections || []) {
        selected = applyExperienceSelection(selected, destination, {
          ...entry,
          dayIndex: Math.min(days - 1, entry.dayIndex || 0),
        });
      }
      resolveExperienceSelections(selected, destination, {
        travelers: plan.travelers,
      });
      const remaining =
        730 - plan.stops.reduce((n, s, i) => n + (i === index ? 0 : s.days), 0);
      let next,
        best,
        bestPending = Infinity;
      // Preserve every explicit choice as scheduled or visibly deferred. Grow only within bounded limits.
      for (
        let count = days;
        count <= Math.min(365, days + 14, remaining);
        count++
      ) {
        const candidateStop = { ...selected, days: count };
        const candidateStops = plan.stops.map((s, i) =>
          i === index ? candidateStop : s,
        );
        if (index === candidateStops.length) candidateStops.push(candidateStop);
        next = suggestJourneyStop(
          { ...plan, stops: candidateStops },
          cities,
          index,
          { candidateIds: selected.attractionIds, includeOptional: true },
        );
        const pending =
          next.deferredAttractionIds.length +
          next.smartPlan.unscheduledExperienceCount;
        if (pending < bestPending) {
          best = next;
          bestPending = pending;
        }
        if (!pending) break;
      }
      next = best;
      if (!next)
        throw Error("完整行程最多支持 730 天，请减少其他城市的停留天数");
      const stops = plan.stops.map((s, i) => (i === index ? next : s));
      if (index === plan.stops.length) stops.push(next);
      calculatePlan({ ...plan, stops, overrides: {} }, cities, rates);
      if (previous) {
        if (!updateStop(index, next)) return false;
      } else if (!change({ stops })) return false;
      setActiveStop(index);
      setTab("itinerary");
      setView("planner");
      window.history.replaceState(null, "", "#/planner");
      const pending =
        next.deferredAttractionIds.length +
        next.smartPlan.unscheduledExperienceCount;
      setToast(
        `${destination.name}的选择已写入当前项目${next.days > days ? `，为容纳内容已从 ${days} 天调整为 ${next.days} 天` : ""}${pending ? `；${pending} 项暂无法排入，已保留候选或待安排提示` : "，行程与费用已同步"}`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return true;
    } catch (error) {
      setToast(error.message);
      return false;
    }
  }
  function savePlan(name) {
    if (appendProject(name || `${activeProject?.name || "旅行"} · 副本`, plan))
      setToast("已另存为独立旅行项目");
  }
  function exportCSV() {
    const rows = [
      [
        "项目",
        "分类",
        "数量",
        "单位",
        "参考低价",
        "参考高价",
        "当前预算",
        "币种",
        "已核对",
        "价格性质",
        "来源",
        "说明",
        "成本性质",
      ],
      ...lines.map((l) => [
        l.label,
        l.category,
        l.quantity,
        l.unit,
        l.missingPrice ? '待补充' : l.low,
        l.missingPrice ? '待补充' : l.high,
        l.missingPrice ? '待补充' : l.amount,
        plan.currency,
        l.confirmed ? "是" : "否",
        l.sourceType,
        l.sourceUrl,
        l.note,
        { daily: "日常成本", fixed: "固定成本", reserve: "机动预算" }[
          l.costGroup
        ] || "",
      ]),
      [
        budget.incomplete ? "已知费用小计（仍有费用待补充）" : "总计",
        "",
        "",
        "",
        "",
        "",
        budget.total,
        plan.currency,
        "",
        "",
        "",
        "含预备金",
        "合计",
      ],
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((r) =>
          r
            .map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"')
            .join(","),
        )
        .join("\r\n");
    download("途算-旅行预算.csv", csv, "text/csv;charset=utf-8");
    setToast("预算明细已导出");
  }
  async function importPlan(e) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 500000) throw Error("文件过大");
      const data = JSON.parse(await file.text());
      const p = data.plan || data;
      if (
        !Array.isArray(p.stops) ||
        !p.stops.length ||
        !p.stops.every((s) => cityById(s.cityId))
      )
        throw Error("文件中含有不支持的城市");
      if (
        appendProject(
          data.name || file.name.replace(/\.json$/i, ""),
          normalizePlan(p, catalogCities),
        )
      )
        setToast("已导入为独立旅行项目");
    } catch (err) {
      setToast("导入失败：" + err.message);
    } finally {
      e.target.value = "";
    }
  }
  function addCity(id, nextView = "planner") {
    if (plan.stops.length >= 8) {
      setToast("一次旅程最多添加 8 座城市");
      return;
    }
    if (plan.stops.some((s) => s.cityId === id)) {
      setToast("这座城市已在旅程中");
      return;
    }
    const nextStop = createRecommendedStop(cityById(id));
    const nextPlan = { ...plan, stops: [...plan.stops, nextStop] };
    nextPlan.stops[nextPlan.stops.length - 1] = suggestJourneyStop(
      nextPlan,
      cities,
      nextPlan.stops.length - 1,
    );
    if (!change({ stops: nextPlan.stops })) return;
    setActiveStop(plan.stops.length);
    setModal(null);
    setView(nextView);
    if (nextView === "globe")
      setToast(`${cityById(id).name}已加入当前旅程，可在项目航线中查看`);
  }
  function addCountry(draft) {
    if (!draft.stops?.length || plan.stops.length + draft.stops.length > 8) { setToast('一次旅程最多支持 8 座城市'); return; }
    const existingIds = new Set(plan.stops.map(stop => stop.cityId));
    if (draft.stops.some(stop => existingIds.has(stop.cityId))) { setToast('部分城市已在旅程中，请重新预览国家路线'); return; }
    let retained;
    try {
      const next = { ...plan, stops: [...plan.stops, ...draft.stops], mode: 'travel', transportModes: draft.transportModes || plan.transportModes || {}, transportModelVersion: 2 };
      if (next.stops.reduce((sum, stop) => sum + stop.days, 0) > 730) throw Error('完整行程最多支持 730 天');
      next.stops = suggestJourneyStops(next, cities, { automaticOnly: true });
      retained = preserveUnchangedQuotes(plan, next, cities, rates);
      setPlan({ ...next, overrides: retained.overrides });
    } catch (error) { setToast(error.message); return; }
    setActiveStop(plan.stops.length); setTab('itinerary'); setModal(null); setView('planner');
    setToast(`已加入${draft.countryName}的 ${draft.stops.length} 座城市，共 ${draft.totalDays} 天${retained.resetIds.length ? `；${retained.resetIds.length} 笔因住宿晚数或路线等变化需重新核对，其他费用记录保留` : '，原有未变化的费用记录保留'}`);
  }
  const currentNights =
    plan.mode === "stay"
      ? stop.days
      : stop.days - (activeStop === plan.stops.length - 1 ? 1 : 0);
  const currentLinks = bookingLinks({
    origin:
      activeStop === 0 ? origin : cityById(plan.stops[activeStop - 1].cityId),
    destination: city,
    departureDate: addDays(
      plan.departureDate,
      plan.stops.slice(0, activeStop).reduce((s, c) => s + c.days, 0),
    ),
    returnDate: addDays(
      plan.departureDate,
      plan.stops.slice(0, activeStop + 1).reduce((s, c) => s + c.days, 0) -
        (plan.mode === "travel" && activeStop === plan.stops.length - 1
          ? 1
          : 0),
    ),
    travelers: plan.travelers,
    rooms: plan.rooms,
  });

  const independentModule = view === "stay" || view === "globe";
  const displayCurrency = independentModule
    ? moduleCurrency || plan.currency
    : plan.currency;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("planner");
          }}
        >
          <span className="brand-mark">
            <Compass size={29} strokeWidth={1.3} />
          </span>
          <strong>途算</strong>
          <span className="brand-divider" />
          <span className="brand-en">WAYFARER</span>
        </a>
        <nav
          className={mobileNav ? "main-nav is-open" : "main-nav"}
          aria-label="主导航"
        >
          <button
            className={view === "planner" ? "active" : ""}
            aria-current={view === "planner" ? "page" : undefined}
            onClick={() => navigate("planner")}
          >
            规划旅程
          </button>
          <button
            className={view === "explore" || view === "city" ? "active" : ""}
            aria-current={
              view === "explore" || view === "city" ? "page" : undefined
            }
            onClick={() => navigate("explore")}
          >
            探索目的地
          </button>
          <button
            className={view === "stay" ? "active" : ""}
            aria-current={view === "stay" ? "page" : undefined}
            onClick={() => navigate("stay")}
          >
            旅居生活
            <span className="nav-dot" />
          </button>
          <button
            className={view === "globe" ? "active" : ""}
            aria-current={view === "globe" ? "page" : undefined}
            onClick={() => navigate("globe")}
          >
            环球探索
          </button>
          <button
            className={view === "sources" ? "active" : ""}
            aria-current={view === "sources" ? "page" : undefined}
            onClick={() => navigate("sources")}
          >
            数据来源
          </button>
          <button
            className="mobile-saved-nav"
            onClick={() => {
              setMobileNav(false);
              setModal({ type: "projects" });
            }}
          >
            我的旅程
          </button>
        </nav>
        <div className="header-right">
          <CurrencySelect label="显示币种" value={displayCurrency} currencies={availableCurrencies} compact
              onChange={(code) => {
                if (independentModule) {
                  setModuleCurrency(code);
                  if (!persist("tusuan-display-currency", code))
                    setToast("显示币种未能保存到浏览器");
                } else changeCurrency(code);
              }}
          />
          <button
            className="saved-button"
            onClick={() => setModal({ type: "projects" })}
          >
            <Heart size={16} />
            <span>我的旅程</span>
            {projects.length > 0 && <b>{projects.length}</b>}
          </button>
          <button
            className="mobile-menu icon-button"
            aria-label="展开导航"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {view === "planner" && (
        <>
          <section className="hero">
            <HeroCarousel city={city} />
            <div className="hero-shade" />
            <div className="hero-content">
              <span className="eyebrow light">
                <span />
                MAKE ROOM FOR THE WORLD
              </span>
              <h1>
                {plan.mode === "stay" ? (
                  <>
                    换一座城，
                    <br />
                    把日子过成喜欢的样子。
                  </>
                ) : (
                  <>
                    心有所向，
                    <br />
                    旅有所算。
                  </>
                )}
              </h1>
              <p>
                {plan.mode === "stay"
                  ? "从一个月的房租，到每天的咖啡。把新生活的成本，提前看清。"
                  : "从第一段旅程，到街角的一杯咖啡。让每一份向往，都有清晰的预算。"}
              </p>
              <div className="hero-foot">
                <span>
                  <MapPin size={15} />
                  {city.name}，{city.country}
                  <i /> {city.nameEn.toUpperCase()}
                </span>
                <span className="hero-counter">
                  0{Math.min(activeStop + 1, 9)}
                  <small> / {String(plan.stops.length).padStart(2, "0")}</small>
                </span>
              </div>
            </div>
          </section>
          <main className="planner-main">
            <ProjectBar
              project={activeProject}
              projects={projects}
              onSwitch={openProject}
              onManage={() => setModal({ type: "projects" })}
              onNew={() => setModal({ type: "new-project" })}
            />
            <section className="trip-controls" aria-label="行程设置">
              <div className="trip-mode">
                <span>
                  <Compass size={17} />
                  {plan.mode === "stay"
                    ? "开启一段新生活"
                    : "一段好旅程，从这里开始"}
                </span>
                <div>
                  <button
                    className={plan.mode === "travel" ? "active" : ""}
                    onClick={() => {
                      if (plan.mode !== "travel") change({ mode: "travel" });
                    }}
                  >
                    旅行
                  </button>
                  <button
                    className={plan.mode === "stay" ? "active" : ""}
                    onClick={() => navigate("stay")}
                  >
                    旅居
                  </button>
                </div>
              </div>
              <div className="trip-fields">
                <button
                  className="trip-field origin-field"
                  onClick={() => setModal({ type: "origin" })}
                >
                  <span className="field-top">
                    <MapPin size={16} />
                    从哪里出发
                  </span>
                  <strong>
                    {origin.name}
                    <small>{origin.iata}</small>
                    <ChevronDown size={14} />
                  </strong>
                </button>
                <div className="trip-field date-field">
                  <label className="field-top" htmlFor="departure">
                    <CalendarDays size={16} />
                    出发日期
                  </label>
                  <input
                    type="date"
                    id="departure"
                    value={plan.departureDate}
                    min={new Date().toISOString().slice(0, 10)}
                    max="2035-12-31"
                    onChange={(e) => {
                      if (e.target.value)
                        change({ departureDate: e.target.value });
                    }}
                  />
                </div>
                <button
                  className="trip-field"
                  onClick={() => setModal({ type: "travelers" })}
                >
                  <span className="field-top">
                    <Users size={16} />
                    同行伙伴
                  </span>
                  <strong>
                    {plan.travelers} 位成人 <small>· {plan.rooms} 间房</small>
                    <ChevronDown size={14} />
                  </strong>
                </button>
                <div className="trip-field duration-field">
                  <span className="field-top">
                    <Sun size={16} />
                    一起走过
                  </span>
                  <strong>
                    {totalDays} 天<small>· {plan.stops.length} 座城市</small>
                  </strong>
                </div>
                <button
                  className="primary-button build-button"
                  onClick={() => {
                    setTab("itinerary");
                    document
                      .getElementById("journey-content")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setToast("已按所选景点生成每日行程，可继续调整");
                  }}
                >
                  <Sparkles size={17} />
                  生成旅行计划
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>
            <section className="section-title-row">
              <div>
                <span className="eyebrow">YOUR NEXT CHAPTER</span>
                <h2>
                  把向往，排进日程<span className="subtle-dot">。</span>
                </h2>
              </div>
              <div className="title-actions">
                <span className="autosave">
                  <span />
                  自动保存在此浏览器
                </span>
                <button
                  className="secondary-button"
                  onClick={() => setModal({ type: "save" })}
                >
                  <Save size={15} />
                  保存旅程
                </button>
              </div>
            </section>
            <div className="planner-layout">
              <div className="journey-column">
                <section className="route-builder panel">
                  <div className="panel-heading">
                    <h3>
                      <Route size={18} />
                      我的旅行路线
                    </h3>
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={plan.returnTrip}
                        onChange={(e) =>
                          change({ returnTrip: e.target.checked })
                        }
                      />
                      <span className="switch" />
                      包含返程
                    </label>
                  </div>
                  <div className="route-start">
                    <span className="route-node">
                      <MapPin size={13} />
                    </span>
                    <span>
                      从 <strong>{origin.name}</strong> 出发
                    </span>
                    <small>{shortDate(plan.departureDate)}</small>
                  </div>
                  <div className="stop-list">
                    {plan.stops.map((s, i) => {
                      const c = cityById(s.cityId);
                      return (
                        <div
                          key={s.cityId}
                          className={
                            "stop-row " + (i === activeStop ? "selected" : "")
                          }
                        >
                          <span className="stop-number">{i + 1}</span>
                          <button
                            className="stop-city"
                            onClick={() => setActiveStop(i)}
                          >
                            <Photo image={c.image} alt={c.name} />
                            <span>
                              <strong>
                                {c.name}
                                <small>{c.nameEn}</small>
                              </strong>
                              <em>
                                {c.country} · {s.attractionIds.length}{" "}
                                个心愿景点
                              </em>
                            </span>
                          </button>
                          <div className="stop-duration"><div className="days-control">
                            <button
                              aria-label={`减少${c.name}天数`}
                              disabled={s.days <= 1}
                              onClick={() =>
                                updateStop(i, { days: s.days - 1 })
                              }
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              aria-label={`${c.name}停留天数`}
                              value={s.days}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isInteger(n) && n >= 1 && n <= 365)
                                  updateStop(i, { days: n });
                              }}
                            />
                            <span>天</span>
                            <button
                              aria-label={`增加${c.name}天数`}
                              disabled={s.days >= 365}
                              onClick={() =>
                                updateStop(i, { days: s.days + 1 })
                              }
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                          <button className="duration-recommendation" title={getTripDuration(c).reason} onClick={() => updateStop(i, { days: recommendedDays(c), daysSource: 'recommendation', planningMode: 'smart' })} aria-label={`采用${c.name}建议${recommendedDays(c)}天`}>{getTripDuration(c).type === 'provisional' ? '暂定' : '建议'} {getTripDuration(c).type === 'provisional' ? '2 天' : getTripDuration(c).label} · 采用 {recommendedDays(c)} 天</button></div>
                          <div className="stop-tools">
                            <button
                              className="icon-button"
                              aria-label={`上移${c.name}`}
                              disabled={i === 0}
                              onClick={() => {
                                const stops = [...plan.stops];
                                [stops[i - 1], stops[i]] = [
                                  stops[i],
                                  stops[i - 1],
                                ];
                                change({ stops });
                                setActiveStop(i - 1);
                              }}
                            >
                              <ArrowDown
                                size={14}
                                style={{ transform: "rotate(180deg)" }}
                              />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`移除${c.name}`}
                              disabled={plan.stops.length === 1}
                              onClick={() => {
                                change({
                                  stops: plan.stops.filter((_, n) => n !== i),
                                });
                                setActiveStop(
                                  Math.max(
                                    0,
                                    Math.min(activeStop, plan.stops.length - 2),
                                  ),
                                );
                              }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    className="add-stop"
                    disabled={plan.stops.length >= 8}
                    onClick={() => setModal({ type: "destination" })}
                  >
                    <Plus size={16} />
                    再添一站<span>探索更多可能</span>
                  </button>
                  {plan.returnTrip && (
                    <div className="route-end">
                      <span className="route-node">
                        <MapPin size={12} />
                      </span>
                      <span>回到 {origin.name}</span>
                      <small>
                        {shortDate(
                          budget?.endDate ||
                            addDays(
                              plan.departureDate,
                              totalDays - (plan.mode === "stay" ? 0 : 1),
                            ),
                        )}
                      </small>
                    </div>
                  )}
                </section>
                <div
                  className="journey-tabs"
                  id="journey-content"
                  role="tablist"
                  aria-label="旅程详情"
                >
                  <button
                    role="tab"
                    aria-selected={tab === "overview"}
                    className={tab === "overview" ? "active" : ""}
                    onClick={() => setTab("overview")}
                  >
                    <Map size={16} />
                    目的地灵感
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === "itinerary"}
                    className={tab === "itinerary" ? "active" : ""}
                    onClick={() => setTab("itinerary")}
                  >
                    <CalendarDays size={16} />
                    每日行程<span>{totalDays}</span>
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === "costs"}
                    className={tab === "costs" ? "active" : ""}
                    onClick={() => setTab("costs")}
                  >
                    <Wallet size={16} />
                    费用明细<span>{lines.length}</span>
                  </button>
                </div>
                {tab === "overview" && (
                  <section className="destination-section">
                    <div className="destination-heading">
                      <div>
                        <span className="eyebrow">
                          STOP {String(activeStop + 1).padStart(2, "0")} /{" "}
                          {city.nameEn.toUpperCase()}
                        </span>
                        <h2>
                          {city.name}
                          <span>{city.tagline}</span>
                        </h2>
                      </div>
                      <OutLink href={currentLinks.maps}>在地图中查看</OutLink>
                    </div>
                    <p className="destination-description">
                      {city.description}
                    </p>
                    <button
                      className="city-home-entry"
                      onClick={() => openCityHome(city.id)}
                    >
                      <Sparkles size={17} /> 打开{city.name}
                      城市主页，挑选餐厅、酒店与体验 <ArrowRight size={16} />
                    </button>
                    <div className="city-tags">
                      {city.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                      <span>
                        <CalendarDays size={12} />
                        {stop.days} 天慢慢感受
                      </span>
                    </div>
                    <div className="sight-library-bar">
                      <div>
                        <strong>
                          {city.attractions.length} 处风景，各有值得停留的理由
                        </strong>
                        <small>
                          已安排 {stop.attractionIds.length} 处 ·
                          {city.planningProfile === "leisure"
                            ? "慢游优先，每天留出休息时间"
                            : "自动规划精选风景与当地体验"}
                        </small>
                      </div>
                      <label className="search-box">
                        <Search size={15} />
                        <input
                          aria-label="搜索当前城市景点"
                          placeholder="搜索景点、校园、街区"
                          value={sightQuery}
                          onChange={(e) => setSightQuery(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="attraction-grid">
                      {city.attractions
                        .filter(
                          (a) =>
                            !sightQuery.trim() ||
                            [a.name, a.nameEn, a.description]
                              .join(" ")
                              .toLowerCase()
                              .includes(sightQuery.trim().toLowerCase()),
                        )
                        .slice(
                          0,
                          showAllSights || sightQuery.trim() ? undefined : 8,
                        )
                        .map((a) => {
                          const selected = stop.attractionIds.includes(a.id);
                          return (
                            <article
                              className={
                                "attraction-card " + (selected ? "chosen" : "")
                              }
                              key={a.id}
                            >
                              <div className="attraction-photo">
                                <Photo
                                  image={a.image?.url ? a.image : undefined}
                                  alt={a.name}
                                />
                                <span className="attraction-price">
                                  {a.price.type === "missing" || a.price.missingPrice
                                    ? "费用待补充"
                                    : a.price.type === "free"
                                    ? "免费探索"
                                    : money(
                                        convert(
                                          a.price.low,
                                          a.price.currency || city.currency,
                                          plan.currency,
                                          rates,
                                        ),
                                        plan.currency,
                                      ) +
                                      (a.price.low !== a.price.high
                                        ? " 起"
                                        : "")}
                                </span>
                                <button
                                  className={
                                    "heart-button " +
                                    (selected ? "selected" : "")
                                  }
                                  aria-label={`${selected ? "移除" : "加入"}${a.name}`}
                                  aria-pressed={selected}
                                  onClick={() => toggleAttraction(a.id)}
                                >
                                  <Heart
                                    size={17}
                                    fill={selected ? "currentColor" : "none"}
                                  />
                                </button>
                              </div>
                              <div className="attraction-body">
                                <small>
                                  {a.durationHours} 小时 ·{" "}
                                  {a.price.type === "missing" || a.price.missingPrice
                                    ? "入场费用待补充"
                                    : a.price.type === "official"
                                    ? "官方参考价"
                                    : a.price.type === "free"
                                      ? "免费开放区域"
                                      : "预算参考价"}
                                </small>
                                <h3>
                                  {a.name}
                                  <ArrowUpRight size={15} />
                                </h3>
                                <p>{a.description}</p>
                                <div className="attraction-bottom">
                                  <OutLink
                                    href={
                                      a.price.sourceUrl || currentLinks.maps
                                    }
                                  >
                                    了解 / 订票
                                  </OutLink>
                                  <button
                                    onClick={() => toggleAttraction(a.id)}
                                    className={selected ? "included" : ""}
                                  >
                                    {selected ? (
                                      <Check size={13} />
                                    ) : (
                                      <Plus size={13} />
                                    )}{" "}
                                    {selected ? "已加入" : "加入行程"}
                                  </button>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                    </div>
                    {!sightQuery && city.attractions.length > 8 && (
                      <button
                        className="secondary-button sight-library-expand"
                        onClick={() => setShowAllSights((v) => !v)}
                      >
                        {showAllSights
                          ? "收起景点库"
                          : `查看全部 ${city.attractions.length} 个景点`}
                        <ChevronDown size={15} />
                      </button>
                    )}
                    {sightQuery &&
                      !city.attractions.some((a) =>
                        [a.name, a.nameEn, a.description]
                          .join(" ")
                          .toLowerCase()
                          .includes(sightQuery.trim().toLowerCase()),
                      ) && (
                        <p className="muted">
                          暂未收录这一地点。可到“每日行程 → 调配景点 →
                          添加景点”创建自定义地点。
                        </p>
                      )}
                    <div className="destination-tip">
                      <Info size={17} />
                      <p>
                        景点加入后，门票和每日安排会同步更新。价格按普通成人计算；具体票种、开放日期及预约条件请查看官方页面。
                      </p>
                    </div>
                    {currentNights > 0 && (
                      <div className="booking-strip">
                        <div>
                          <BedDouble size={25} />
                          <span>
                            <strong>找到今晚的落脚处</strong>
                            <small>
                              {city.name} · {TIERS[plan.tier].name} ·{" "}
                              {plan.rooms} 间房
                            </small>
                          </span>
                        </div>
                        <OutLink href={currentLinks.hotels}>
                          查看实际房价
                        </OutLink>
                      </div>
                    )}
                    {(budget?.legs || [])
                      .filter((l) => l.toId === city.id)
                      .map((l) => (
                        <div className="booking-strip" key={l.id}>
                          <div>
                            {['high-speed-rail', 'rail'].includes(l.transportMode) ? <TrainFront size={25} /> : l.transportMode === 'boat' ? <Ship size={25} /> : l.transportMode === 'road' ? <Car size={25} /> : <Plane size={25} />}
                            <span>
                              <strong>
                                {cityById(l.fromId).name} → {city.name}
                              </strong>
                              <small>
                                {l.modeLabel || '城际交通'} · {l.distanceKm.toLocaleString()} km ·
                                城际交通预算 {money(l.amount, plan.currency)}
                              </small>
                            </span>
                          </div>
                          <OutLink href={l.link}>查询交通实价</OutLink>
                        </div>
                      ))}
                    {city.transportReference && (
                      <section className="menu-samples panel">
                        <div className="panel-heading">
                          <h3>
                            <Route size={17} />
                            地铁通票，先看官方价
                          </h3>
                          <OutLink href={city.transportReference.sourceUrl}>
                            查看适用范围
                          </OutLink>
                        </div>
                        <p>
                          东京 Metro 与都营地铁旅游票；不包含 JR
                          和机场线，须符合游客购买条件。它是独立票种参考，不等同于每日交通预算。
                        </p>
                        <div className="transit-prices">
                          {Object.entries(city.transportReference.prices).map(
                            ([duration, amount]) => (
                              <div key={duration}>
                                <span>{duration.replace("h", " 小时")}</span>
                                <strong>
                                  {money(
                                    amount,
                                    city.transportReference.currency,
                                  )}
                                </strong>
                                <small>
                                  约{" "}
                                  {money(
                                    convert(
                                      amount,
                                      city.transportReference.currency,
                                      plan.currency,
                                      rates,
                                    ),
                                    plan.currency,
                                  )}
                                </small>
                              </div>
                            ),
                          )}
                        </div>
                      </section>
                    )}
                    {(catalog.priceSamples || []).some(
                      (s) => s.cityId === city.id,
                    ) && (
                      <section className="menu-samples panel">
                        <div className="panel-heading">
                          <h3>
                            <Utensils size={17} />
                            街头的一餐，要花多少？
                          </h3>
                          <span className="badge green">官方菜单实例</span>
                        </div>
                        <p>
                          具体门店的公开菜单价，供你理解当地消费，不代表整座城市的日均餐费。
                        </p>
                        {(catalog.priceSamples || [])
                          .filter((s) => s.cityId === city.id)
                          .slice(0, 4)
                          .map((s) => (
                            <div className="menu-sample" key={s.id}>
                              <span>
                                <strong>{s.label}</strong>
                                <small>
                                  {s.sourceName} · {money(s.amount, s.currency)}{" "}
                                  / {s.unit}
                                </small>
                                <small className="sample-context">
                                  {s.note} · 核验 {s.checkedAt?.slice(0, 10)}
                                </small>
                              </span>
                              <span>
                                <strong>
                                  {money(
                                    convert(
                                      s.amount,
                                      s.currency,
                                      plan.currency,
                                      rates,
                                    ),
                                    plan.currency,
                                  )}
                                </strong>
                                <OutLink href={s.sourceUrl}>官方菜单</OutLink>
                              </span>
                            </div>
                          ))}
                      </section>
                    )}
                  </section>
                )}
                {tab === "itinerary" && (
                  <div className="itinerary-section">
                    <button
                      className="city-home-entry"
                      onClick={() => openCityHome(city.id)}
                    >
                      <Plus size={16} /> 在{city.name}
                      主页挑选或调整餐厅、酒店、体验 <ArrowRight size={16} />
                    </button>
                    <ItineraryPlanner
                      key={activeProjectId}
                      plan={plan}
                      cities={cities}
                      rates={rates}
                      itinerary={itinerary}
                      priceSamples={catalog.priceSamples || []}
                      onUpdateStop={updateStop}
                      onAddCustomAttraction={addCustomAttraction}
                      onToast={setToast}
                      onOpenCity={openCityHome}
                      onEditLine={(id) => {
                        const line = lines.find((l) => l.id === id);
                        if (line) setModal({ type: "line", line });
                      }}
                    />
                  </div>
                )}
                {tab === "costs" && (
                  <section className="costs-section">
                    <div className="content-heading">
                      <div>
                        <h2>每一笔，都心里有数</h2>
                        <p>日常开销按偏好计算，一次性费用随行程核对。</p>
                      </div>
                      <button className="secondary-button" onClick={exportCSV}>
                        <ArrowDownToLine size={15} />
                        导出明细
                      </button>
                    </div>
                    <CostPreferences
                      key={activeProjectId}
                      plan={plan}
                      budget={budget}
                      cities={cities}
                      rates={rates}
                      activeStop={activeStop}
                      onSelectStop={setActiveStop}
                      onApply={setDailyPreferences}
                      onOpenCity={openCityHome}
                    />
                    <div className="cost-type-tabs" aria-label="费用类型">
                      {[
                        ["all", "全部明细"],
                        ["daily", "日常成本"],
                        ["fixed", "固定成本"],
                        ["reserve", "机动预算"],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          className={costFilter === id ? "active" : ""}
                          onClick={() => setCostFilter(id)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="cost-table-wrap panel">
                      <table className="cost-table">
                        <thead>
                          <tr>
                            <th>费用项目 / 计费方式</th>
                            <th>参考区间</th>
                            <th>当前预算</th>
                            <th>核对</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines
                            .filter(
                              (l) =>
                                costFilter === "all" ||
                                l.costGroup === costFilter,
                            )
                            .map((l) => {
                              const Icon = CAT_ICONS[l.category] || Wallet;
                              return (
                                <tr
                                  key={l.id}
                                  onClick={() =>
                                    setModal({ type: "line", line: l })
                                  }
                                >
                                  <td>
                                    <div className="cost-label">
                                      <span>
                                        <Icon size={16} />
                                      </span>
                                      <div>
                                        <strong>{l.label}</strong>
                                        <small>
                                          {Number(l.quantity.toFixed(2))}{" "}
                                          {l.unit} ·{" "}
                                          {l.missingPrice ? "价格待补充" : l.sourceType === "official"
                                            ? "官方参考价"
                                            : l.sourceType === "user"
                                              ? "手动录入"
                                              : l.sourceType ===
                                                  "user-preference"
                                                ? "你的消费偏好"
                                                : "估算 / 参考预算"}
                                        </small>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span>{l.missingPrice ? '待补充' : money(l.low, plan.currency)}</span>
                                    <small>
                                      {l.missingPrice ? '可录入预算' : `— ${money(l.high, plan.currency)}`}
                                    </small>
                                  </td>
                                  <td>
                                    <strong>
                                      {l.missingPrice ? '待补充' : money(l.amount, plan.currency)}
                                    </strong>
                                  </td>
                                  <td>
                                    <button
                                      className={
                                        "confirm-button " +
                                        (l.confirmed ? "done" : "")
                                      }
                                      aria-label={`核对${l.label}`}
                                    >
                                      {l.confirmed ? (
                                        <CircleCheck size={19} />
                                      ) : (
                                        <ChevronRight size={18} />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    <div className="cost-notes">
                      <h4>预算口径</h4>
                      <p>
                        住宿按房间与晚数计算，餐饮、门票等按成人数计算。区间代表轻装到高配的参考档位，并非市场最低或最高成交价。费用明细均可编辑。
                      </p>
                      {(budget?.warnings || []).map((w, i) => (
                        <p key={i}>· {typeof w === "string" ? w : w.message}</p>
                      ))}
                    </div>
                  </section>
                )}
              </div>
              <aside className="budget-column">
                <section className="budget-panel panel">
                  <div className="budget-top">
                    <span>
                      <Wallet size={17} />
                      旅行预算
                    </span>
                    <span className="live-badge">
                      <span />
                      随行程更新
                    </span>
                  </div>
                  <div className="budget-total">
                    <span>
                      {plan.travelers} 人 · {totalDays} 天
                      {plan.mode === "stay" ? "旅居" : ""}{budget?.incomplete ? '的已知费用小计' : '的预计总花费'}
                    </span>
                    <h2>
                      {money(budget?.total, plan.currency)}
                      <small>{plan.currency}</small>
                    </h2>
                    <p>
                      {budget?.incomplete ? '已知部分区间' : '参考区间'} {money(budget?.low, plan.currency)} —{" "}
                      {money(budget?.high, plan.currency)}
                    </p>
                  </div>
                  <div className="style-panel" role="group" aria-label="旅行风格与预算档位">
                    <div className="budget-style-label">旅行风格</div>
                    <div className="tier-grid">
                      {TIERS.map((t, i) => (
                        <button
                          key={t.name}
                          type="button"
                          className={"tier-card " + (plan.tier === i ? "active" : "")}
                          aria-pressed={plan.tier === i}
                          aria-description={t.description}
                          title={t.description}
                          onClick={() => change({ tier: i })}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  {budget?.incomplete && <div className="airport-budget-notice" role="status">仍有 {budget.missingCosts?.length} 项食宿等费用待补充。上方金额不是完整旅行总价，可在消费偏好和费用明细中录入。</div>}
                  <div className="budget-mini-stats">
                    <div>
                      <span>{budget?.incomplete ? '人均已知费用' : '人均预算'}</span>
                      <strong>{money(budget?.perPerson, plan.currency)}</strong>
                    </div>
                    <div>
                      <span>{budget?.incomplete ? '已知费用日均' : '全员日均'}</span>
                      <strong>
                        {money((budget?.total || 0) / totalDays, plan.currency)}
                      </strong>
                    </div>
                  </div>
                  <div className="budget-cost-groups">
                    {(budget?.costGroups || []).map((g) => (
                      <BudgetPopover key={g.id} label={`${g.label}明细`} className="budget-group-trigger" trigger={<><span>
                          {g.label}
                          {g.id === "daily" && (
                            <small>
                              {g.missingPrice ? '含待补充项目' : `${money(g.perDay, plan.currency)} / 全员每天`}
                            </small>
                          )}
                        </span>
                        <strong>{g.missingPrice && !g.amount ? '待补充' : money(g.amount, plan.currency)}{g.missingPrice && g.amount > 0 ? ' + 待补充' : ''}</strong></>}>
                        <BudgetLineDetails lines={lines.filter((line) => line.costGroup === g.id)} currency={plan.currency}
                          onEditLine={editBudgetLine} />
                      </BudgetPopover>
                    ))}
                  </div>
                  <div className="budget-chart" aria-label="费用分类占比">
                    {categories
                      .filter((c) => c.amount > 0)
                      .map((c, i) => (
                        <span
                          key={c.id}
                          style={{
                            flex: c.amount,
                            background: CAT_COLORS[i % CAT_COLORS.length],
                          }}
                          title={`${c.label} ${money(c.amount, plan.currency)}`}
                        />
                      ))}
                  </div>
                  <div className="budget-category-list">
                    {categories.map((c, i) => (
                      <BudgetPopover key={c.id} label={`${c.label}明细`} wide={c.id === 'intercity'} className="budget-category-trigger" trigger={<>
                        <span>
                          <i
                            style={{
                              background: CAT_COLORS[i % CAT_COLORS.length],
                            }}
                          />
                          {c.label}
                        </span>
                        <strong>
                          {c.missingPrice ? (c.amount > 0 ? `${money(c.amount, plan.currency)} + 待补充` : '待补充') : c.id === "visa" && !plan.overrides?.visa
                            ? "待填写"
                            : money(c.amount, plan.currency)}
                          <ChevronRight size={13} />
                        </strong>
                      </>}>
                        {c.id === 'intercity' && <JourneyTransport plan={plan} cities={cities} budget={budget}
                          onChange={setTransportWindow} onModeChange={setTransportMode} onEditLine={editBudgetLine} />}
                        {c.id !== 'intercity' && <BudgetLineDetails lines={lines.filter((line) => line.category === c.id)} currency={plan.currency}
                          onEditLine={editBudgetLine} />}
                        {c.id === 'transfer' && <p className="budget-detail-note">接驳费与城际票价分开列出，均已计入总预算；在“城际交通”中选择飞机或铁路后，会同步更新对应的机场或车站接驳预留。</p>}
                      </BudgetPopover>
                    ))}
                  </div>
                  <div className="reserve-setting">
                    <span>
                      给意外留一点余量
                      <Info size={13} />
                    </span>
                    <select
                      aria-label="预备金比例"
                      value={plan.reservePercent}
                      onChange={(e) =>
                        change(
                          { reservePercent: Number(e.target.value) },
                          { keep: true },
                        )
                      }
                    >
                      {[0, 5, 10, 15, 20, 30].map((n) => (
                        <option key={n} value={n}>
                          {n}% 预备金
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="confirmation-progress">
                    <div>
                      <span>
                        <ShieldCheck size={14} />
                        已核对 {confirmedLines.length} / {lines.length} 项
                      </span>
                      <strong>{money(confirmedAmount, plan.currency)}</strong>
                    </div>
                    <div className="progress-track">
                      <span
                        style={{
                          width: `${lines.length ? (confirmedLines.length / lines.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <small>越多确认，离出发越近一步。</small>
                  </div>
                  <button
                    className="primary-button full"
                    onClick={() => {
                      setTab("costs");
                      document
                        .getElementById("journey-content")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    逐项核对我的预算
                    <ArrowRight size={16} />
                  </button>
                  <button className="budget-export" onClick={exportCSV}>
                    <ArrowDownToLine size={14} />
                    导出完整预算
                  </button>
                  <p className="budget-disclaimer">
                    这是规划预算，尚非可预订报价。机酒、餐饮采用估算；官方门票也可能随日期与票种变化。另需核对签证、城市税与押金等。
                  </p>
                  {budget?.error && (
                    <div className="error-notice">{budget.error}</div>
                  )}
                </section>
                <div className="little-note">
                  <span className="note-icon">
                    <Leaf size={21} />
                  </span>
                  <div>
                    <strong>为体验花钱，为安心留白。</strong>
                    <p>
                      好预算不会限制旅行，
                      <br />
                      它让你更放心地出发。
                    </p>
                  </div>
                  <span className="note-spark">✳</span>
                </div>
                <div className="data-footnote">
                  <Database size={13} />
                  <span>
                    价格有来源，估算有标记
                    <br />
                    <button onClick={() => setView("sources")}>
                      了解数据与更新机制 <ArrowUpRight size={11} />
                    </button>
                  </span>
                </div>
              </aside>
            </div>
            <section className="discovery-banner">
              <div>
                <span className="eyebrow">THE WORLD IS STILL BIG</span>
                <h2>下一段故事，会在哪里？</h2>
                <p>比较城市的日常开销，找到适合你的远方。</p>
              </div>
              <button
                className="secondary-button"
                onClick={() => navigate("explore")}
              >
                探索 {cities.length} 座城市
                <ArrowUpRight size={17} />
              </button>
              <Globe2 className="banner-globe" size={160} strokeWidth={0.5} />
            </section>
          </main>
        </>
      )}

      {independentModule && (
        <Suspense
          fallback={
            <main className="module-loading page-width" role="status">
              <Compass size={30} />
              <p>正在展开你的世界…</p>
            </main>
          }
        >
          {view === "stay" ? (
            <LivingPage
              cities={detailedCities}
              rates={rates}
              currency={displayCurrency}
              onOpenCity={openCityHome}
              onToast={setToast}
            />
          ) : (
            <GlobePage
              cities={cities}
              rates={rates}
              currency={displayCurrency}
              projects={projects}
              activeProjectId={activeProjectId}
              onOpenCity={openCityHome}
              onAddCity={(id) => addCity(id, "globe")}
              onOpenProject={openProject}
              onToast={setToast}
            />
          )}
        </Suspense>
      )}

      {view === "city" && cityById(homeCityId)?.coverage === 'airport-only' && <AirportCityHome city={cityById(homeCityId)} onBack={() => navigate('globe')} onAdd={() => addCity(homeCityId, 'globe')} />}
      {view === "city" && cityById(homeCityId)?.coverage !== 'airport-only' && (
        <CityHome
          key={activeProjectId}
          city={cityById(homeCityId) || cities[0]}
          cities={detailedCities}
          plan={plan}
          rates={rates}
          onBack={() => navigate("explore")}
          onSelectCity={openCityHome}
          onGenerate={generateCityPlan}
          onToast={setToast}
        />
      )}
      {view === "explore" && (
        <main className="explore-page page-width">
          <div className="page-intro">
            <span className="eyebrow">FIND YOUR KIND OF SOMEWHERE</span>
            <h1>
              世界很大，
              <br />
              找到属于你的那一站。
            </h1>
            <p>从熟悉的城市到陌生的街角，先看看生活在那里要花多少钱。</p>
            <div className="destination-coverage">
              <span>
                <strong>
                  {new Set(detailedCities.map((c) => c.countryCode)).size}
                </strong>{" "}
                个国家与地区
              </span>
              <span>
                <strong>{detailedCities.length}</strong> 个旅行攻略目的地
              </span>
              <span>
                <strong>
                  {detailedCities.reduce((n, c) => n + c.attractions.length, 0)}
                </strong>{" "}
                处风景与体验
              </span>
            </div>
          </div>
          {!!catalog.airportCities?.length && <div className="airport-discovery"><div><Plane size={24} /><div><strong>从这里，连接更多地方</strong><p>搜索 {cities.length.toLocaleString('zh-CN')} 处城市与机场所在地，加入旅行路线。已有攻略的目的地在下方展示。</p></div></div><button className="secondary-button" onClick={() => setModal({type:'airport-explore'})}>搜索全球目的地 <Search size={16} /></button></div>}
          <DestinationGallery cities={detailedCities} currency={displayCurrency} rates={rates} renderCity={(c) => (
                <article key={c.id} className="explore-card">
                  <div className="explore-photo">
                    <Photo image={c.image} alt={c.name} />
                    <span><CountryFlag code={c.countryCode} />{c.country}</span>
                    <button
                      className={
                        "compare-check " +
                        (compare.includes(c.id) ? "selected" : "")
                      }
                      aria-label={`比较${c.name}`}
                      aria-pressed={compare.includes(c.id)}
                      onClick={() =>
                        setCompare((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((id) => id !== c.id)
                            : prev.length < 3
                              ? [...prev, c.id]
                              : prev,
                        )
                      }
                    >
                      {compare.includes(c.id) ? (
                        <Check size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                    <div>
                      <small>{c.nameEn.toUpperCase()}</small>
                      <h2>{c.name}</h2>
                    </div>
                  </div>
                  <div className="explore-card-body">
                    <p>{c.tagline}</p>
                    <button
                      className="city-home-entry"
                      onClick={() => openCityHome(c.id)}
                      aria-label={`探索${c.name}城市主页`}
                    >
                      景点 · 餐桌 · 住处 · 体验 <ArrowRight size={16} />
                    </button>
                    <div className="explore-cost">
                      <span>
                        轻装旅行 · 每人每天
                        <strong>
                          {money(
                            convert(
                              c.daily.lodging[0] / 2 +
                                c.daily.food[0] +
                                c.daily.transport[0] +
                                c.daily.misc[0],
                              c.currency,
                              plan.currency,
                              rates,
                            ),
                            plan.currency,
                          )}{" "}
                          <small>起</small>
                        </strong>
                      </span>
                      <button
                        className="round-button"
                        aria-label={`将${c.name}加入旅程`}
                        onClick={() => {
                          if (plan.stops.length >= 8) {
                            setToast("最多支持 8 个目的地，请先调整路线");
                            return;
                          }
                          addCity(c.id);
                        }}
                      >
                        <ArrowUpRight size={21} />
                      </button>
                    </div>
                    <small className="muted">
                      估算 · 2 人合住 · 不含往返交通与门票
                    </small>
                  </div>
                </article>
          )} />
          {compare.length > 0 && (
            <div className="compare-bar">
              <span>
                <Map size={19} />
                已选 {compare.length} / 3 座城市
              </span>
              <div>
                {compare.map((id) => (
                  <button
                    key={id}
                    onClick={() => setCompare(compare.filter((v) => v !== id))}
                  >
                    {cityById(id).name}
                    <X size={13} />
                  </button>
                ))}
              </div>
              <button
                className="primary-button"
                disabled={compare.length < 2}
                onClick={() => setModal({ type: "compare" })}
              >
                比较生活成本
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </main>
      )}

      {view === "sources" && (
        <main className="sources-page page-width">
          <div className="page-intro">
            <span className="eyebrow">A CLEARER PICTURE</span>
            <h1>
              让每个数字，
              <br />
              都有迹可循。
            </h1>
            <p>
              预算的价值在于清楚。这里展示价格依据、汇率时间，以及尚待你确认的部分。
            </p>
          </div>
          <div className="source-stats">
            <div className="panel">
              <Globe2 />
              <strong>{detailedCities.length}</strong>
              <span>有景点与预算资料的目的地</span>
            </div>
            <div className="panel">
              <Ticket />
              <strong>{sourceCount}</strong>
              <span>有官方价参考的景点</span>
            </div>
            <div className="panel">
              <RefreshCw />
              <strong>{rates?.asOf?.slice(0, 10) || "参考汇率"}</strong>
              <span>
                汇率数据日期 ·{" "}
                {{
                  fresh: "已更新",
                  live: "已更新",
                  cached: "缓存",
                  stale: "较旧",
                }[rates?.status] ||
                  rates?.status ||
                  "缓存"}
              </span>
            </div>
          </div>
          {!!catalog.airportCoverage?.airportCount && <section className="panel data-principles"><h2>全球机场与城市名录</h2><p>收录 {catalog.airportCoverage.airportCount.toLocaleString('zh-CN')} 座机场、{catalog.airportCoverage.airportCityCount.toLocaleString('zh-CN')} 个城市或机场所在地，覆盖 {catalog.airportCoverage.countryCount} 个国家与地区。</p><p>{catalog.airportCoverage.note}</p><p className="small muted">来源：<OutLink href="https://ourairports.com/data/">OurAirports · 公有领域机场数据</OutLink> · 采集于 {catalog.airportCoverage.generatedAt?.slice(0,10)}。每 7 天随现有维护任务刷新；失败保留上次完整数据。最新检查状态：{(status?.airportCoverage || catalog.airportCoverage).maintenance?.status === 'error' ? '更新失败，保留旧数据' : '已有有效快照'}。</p></section>}
          <section className="panel data-principles">
            <h2>理解你的预算</h2>
            <div className="principle-grid">
              <div>
                <span className="badge green">官方参考价</span>
                <h3>有来源的公开价格</h3>
                <p>
                  门票等参考官方公开页面。注明票种、适用人群和核验时间，交易时以官方页面为准。
                </p>
              </div>
              <div>
                <span className="badge">预算估算</span>
                <h3>可调整的规划区间</h3>
                <p>
                  住宿、餐饮、租金与航段使用编辑预算或距离模型。并非抓取到的实时库存，也不是市场价格极值。
                </p>
              </div>
              <div>
                <span className="badge warm">你核对的金额</span>
                <h3>把实际报价带回来</h3>
                <p>
                  跳转查价后录入该项目的含税总额。报价随日期而变，只有你勾选的项目才标记为已核对。
                </p>
              </div>
            </div>
          </section>
          <section className="panel update-panel">
            <div className="panel-heading">
              <h2>持续更新与数据状态</h2>
              <button
                className="secondary-button"
                onClick={refreshStatus}
                disabled={statusLoading}
              >
                <RefreshCw size={15} className={statusLoading ? "spin" : ""} />
                {statusLoading ? "读取中" : "刷新状态"}
              </button>
            </div>
            <p>
              后台更新程序获取汇率和已接入的官方票价页面，保存历史观察记录。解析失败保留旧数据并标记状态，不用新时间伪装旧价格。
            </p>
            <div className="update-facts">
              <span>
                <strong>具体餐宿与体验</strong>
                {catalog.experienceMaintenance?.placeCount || 0} 个地点 ·{" "}
                {catalog.experienceMaintenance?.optionCount || 0} 种服务方案
              </span>
              <span>
                <strong>商家来源检查</strong>
                {catalog.experienceMaintenance?.audit
                  ? `${catalog.experienceMaintenance.audit.totalSources} 个公开链接 · ${catalog.experienceMaintenance.audit.review.length} 个地点待复核`
                  : "来源资料已记录，等待自动链接检查"}
              </span>
              <span>
                <strong>汇率来源</strong>
                <OutLink href="https://frankfurter.dev/">
                  Frankfurter / 官方汇率汇总
                </OutLink>
              </span>
              <span>
                <strong>当前数据日期</strong>
                {rates?.asOf || "未更新"}
              </span>
              <span>
                <strong>机票 / 酒店实时库存</strong>尚未接入合作方凭据 ·
                当前提供查询链接
              </span>
              <span>
                <strong>自动维护计划</strong>
                {status?.deployment?.mode === 'static'
                  ? status.schedule?.label || '定时刷新公开数据并发布'
                  : status?.schedule?.windowsTask?.installed
                  ? `已记录每日 ${status.schedule.windowsTask.dailyAt} 更新任务 · ${status.schedule.windowsTask.timezone}`
                  : "查看本机任务计划配置"}
              </span>
            </div>
            {status && (
              <div className="source-health">
                {(status.sources || []).map((s) => (
                  <div key={s.id}>
                    <span>
                      <strong>{s.name || s.label || s.id}</strong>
                      <small>
                        {s.successAt
                          ? "最近成功 " +
                            new Date(s.successAt).toLocaleString("zh-CN")
                          : "暂无成功采集，保留原参考值"}
                      </small>
                    </span>
                    <span
                      className={
                        "badge " +
                        (s.status === "ok" || s.status === "success"
                          ? "green"
                          : "warm")
                      }
                    >
                      {{
                        ok: "已更新",
                        success: "已更新",
                        error: "更新失败",
                        failed: "更新失败",
                        "never-fetched": "尚未采集",
                      }[s.status] || s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {status && (
              <details className="status-details">
                <summary>查看数据库更新记录与接口状态</summary>
                <pre>{JSON.stringify(status, null, 2)}</pre>
              </details>
            )}
            <p className="small muted">
              {status?.deployment?.mode === 'static' ? `${status.schedule?.note || '公开数据按定时任务更新；如来源暂时不可访问，会保留已有参考值。'} ` : '已配置的自动任务需电脑开机且当前用户已登录。'}住宿与餐饮的编辑预算不会因汇率更新而标为重新采样。图片为缩略图，展示时可能裁切。
            </p>
          </section>
          <section className="source-table-section">
            <div className="content-heading">
              <div>
                <h2>景点价格来源</h2>
                <p>按当地货币展示，完整保留票种说明。</p>
              </div>
            </div>
            <div className="source-list">
              {detailedCities.map((c) => (
                <details className="panel city-sources" key={c.id}>
                  <summary>
                    <span>
                      {c.name} <small>{c.nameEn}</small>
                    </span>
                    <span>
                      {c.attractions.length} 项<ChevronDown size={16} />
                    </span>
                  </summary>
                  {c.attractions.map((a) => (
                    <div className="source-item" key={a.id}>
                      <div>
                        <strong>{a.name}</strong>
                        <p>{a.price.note || a.description}</p>
                        <small>
                          {a.price.type === "missing" || a.price.missingPrice
                            ? "费用待补充"
                            : a.price.type === "official"
                            ? "官方参考价"
                            : a.price.type === "free"
                              ? "免费开放区域"
                              : "编辑估算"}{" "}
                          · 核验 {a.price.checkedAt || "未核验"}
                        </small>
                      </div>
                      <div>
                        <strong>
                          {a.price.type === "missing" || a.price.missingPrice ? "待补充" : money(a.price.low, a.price.currency || c.currency)}
                          {a.price.type !== "missing" && !a.price.missingPrice && a.price.high !== a.price.low
                            ? " — " +
                              money(
                                a.price.high,
                                a.price.currency || c.currency,
                              )
                            : ""}
                        </strong>
                        <OutLink href={a.price.sourceUrl}>
                          {a.price.sourceName || "官方来源"}
                        </OutLink>
                      </div>
                    </div>
                  ))}
                  <div className="image-source">
                    <span>
                      城市图片：{c.image?.credit} ·{" "}
                      {c.image?.license || "来源页面许可"}
                    </span>
                    <span className="license-links">
                      <OutLink href={c.image?.sourceUrl}>摄影来源</OutLink>
                      {c.image?.licenseUrl && (
                        <OutLink href={c.image.licenseUrl}>许可</OutLink>
                      )}
                    </span>
                  </div>
                  {c.attractions.map((a) => (
                    <div className="image-source" key={a.id}>
                      <span>
                        {a.name}图片：{a.image?.credit} ·{" "}
                        {a.image?.license || "来源页面许可"}
                      </span>
                      <span className="license-links">
                        <OutLink href={a.image?.sourceUrl}>摄影来源</OutLink>
                        {a.image?.licenseUrl && (
                          <OutLink href={a.image.licenseUrl}>许可</OutLink>
                        )}
                      </span>
                    </div>
                  ))}
                </details>
              ))}
            </div>
          </section>
        </main>
      )}

      {view === "planner" && (
        <div className="mobile-budget-bar">
          <span>
            <small>
              {plan.travelers} 人 · {totalDays} 天{budget?.incomplete ? '已知费用小计' : '预计总额'}
            </small>
            <strong>{money(budget?.total, plan.currency)}</strong>
          </span>
          <button
            className="primary-button"
            onClick={() => {
              setTab("costs");
              document
                .getElementById("journey-content")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            核对明细
            <ArrowRight size={15} />
          </button>
        </div>
      )}
      <footer className="site-footer">
        <div className="footer-brand">
          <Compass size={24} />
          <strong>途算</strong>
          <span>把向往，算进生活。</span>
        </div>
        <div>
          <button onClick={() => navigate("sources")}>数据与图片来源</button>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">地点资料 © OpenStreetMap contributors · ODbL</a>
          <span>用清晰的预算，换轻松的出发。</span>
        </div>
        <small>WAYFARER © {new Date().getFullYear()}</small>
      </footer>
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={17} />
          {toast}
          <button
            className="icon-button"
            aria-label="关闭提示"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <input
        ref={importRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={importPlan}
      />
      {modal?.type === "origin" && (
        <CityPicker
          origin
          cities={cities}
          title="这次旅程，从哪里出发？"
          rates={rates}
          currency={plan.currency}
          onClose={() => setModal(null)}
          onPick={(id) => {
            change({ originId: id });
            setModal(null);
          }}
        />
      )}
      {modal?.type === 'airport-explore' && <CityPicker cities={cities} title="探索全球城市与机场所在地" currency={plan.currency} rates={rates} onClose={() => setModal(null)} onPick={(id) => { setModal(null); openCityHome(id); }} />}
      {modal?.type === "new-project" && (
        <ProjectForm
          cities={catalogCities}
          originId={plan.originId}
          departureDate={plan.departureDate}
          returnTrip={plan.returnTrip}
          onClose={() => setModal(null)}
          onCreate={createProject}
        />
      )}
      {modal?.type === "projects" && (
        <ProjectsModal
          projects={projects}
          activeId={activeProjectId}
          cities={catalogCities}
          rates={rates}
          onClose={() => setModal(null)}
          onSwitch={openProject}
          onNew={() => setModal({ type: "new-project" })}
          onRename={(id, name) => {
            setProjects((p) =>
              p.map((x) =>
                x.id === id
                  ? {
                      ...x,
                      name: name.trim().slice(0, 60) || x.name,
                      updatedAt: new Date().toISOString(),
                    }
                  : x,
              ),
            );
          }}
          onDuplicate={duplicateProject}
          onDelete={deleteProject}
          onImport={() => importRef.current.click()}
          onExport={() =>
            download(
              `途算-${activeProject?.name || "旅行项目"}.json`,
              JSON.stringify(
                { version: 2, name: activeProject?.name, plan },
                null,
                2,
              ),
            )
          }
        />
      )}
      {modal?.type === "destination" && (
        <CityPicker
          cities={cities}
          exclude={plan.stops.map((s) => s.cityId)}
          rates={rates}
          currency={plan.currency}
          onClose={() => setModal(null)}
          onPick={addCity}
          onChooseCountry={() => setModal({ type: 'country-destination' })}
        />
      )}
      {modal?.type === 'country-destination' && <Modal title="用一段时间，探索一个国家" onClose={() => setModal(null)} wide><div className="planning-unit-switch" role="group" aria-label="按城市或国家添加"><button type="button" aria-pressed="false" onClick={() => setModal({ type: 'destination' })}>选择城市</button><button type="button" aria-pressed="true">探索一个国家</button></div><CountryTripPlanner cities={cities} planContext={plan} originId={plan.originId} departureDate={plan.departureDate} returnToOrigin={plan.returnTrip} initialDays={7} onApply={addCountry} applyLabel="将这些城市加入旅程" /></Modal>}
      {modal?.type === "travelers" && (
        <Modal title="和谁一起出发？" onClose={() => setModal(null)}>
          <p className="muted">
            当前按成人票价计算。同行人数与房间数将影响预算。
          </p>
          {[
            {
              key: "travelers",
              name: "成人",
              desc: "城际车票或机票、餐饮、门票按人数计算",
              icon: Users,
            },
            {
              key: "rooms",
              name: "房间",
              desc: "住宿按房间数计算，请自行确认房型容量",
              icon: BedDouble,
            },
          ].map((f) => (
            <div className="traveler-row" key={f.key}>
              <f.icon size={23} />
              <div>
                <strong>{f.name}</strong>
                <small>{f.desc}</small>
              </div>
              <div className="days-control">
                <button
                  disabled={plan[f.key] <= 1}
                  aria-label={"减少" + f.name}
                  onClick={() => change({ [f.key]: plan[f.key] - 1 })}
                >
                  <Minus size={14} />
                </button>
                <strong>{plan[f.key]}</strong>
                <button
                  disabled={
                    plan[f.key] >= (f.key === "rooms" ? plan.travelers : 20)
                  }
                  aria-label={"增加" + f.name}
                  onClick={() => change({ [f.key]: plan[f.key] + 1 })}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
          <div className="modal-actions">
            <button className="primary-button" onClick={() => setModal(null)}>
              确定
              <Check size={16} />
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "line" && (
        <LineEditor
          line={lines.find((l) => l.id === modal.line.id) || modal.line}
          currency={plan.currency}
          onClose={() => setModal(null)}
          onApply={(value) => {
            setPlan((p) => ({
              ...p,
              overrides: { ...p.overrides, [modal.line.id]: value },
            }));
            setModal(null);
            setToast(
              value.confirmed ? "已保存，并标记为已核对" : "已保存你的预算金额",
            );
          }}
          onReset={() => {
            setPlan((p) => ({
              ...p,
              overrides: Object.fromEntries(
                Object.entries(p.overrides).filter(
                  ([k]) => k !== modal.line.id,
                ),
              ),
            }));
            setModal(null);
            setToast("已恢复该项目的参考预算");
          }}
        />
      )}
      {modal?.type === "save" && (
        <SaveModal
          onClose={() => setModal(null)}
          onSave={savePlan}
          defaultName={
            plan.stops.map((s) => cityById(s.cityId).name).join(" · ") +
            ` ${totalDays}日${plan.mode === "stay" ? "旅居" : "之旅"}`
          }
        />
      )}
      {modal?.type === "saved" && (
        <Modal title="我的旅程收藏夹" onClose={() => setModal(null)}>
          <p className="small muted">
            保存在当前浏览器。导出 JSON 文件可备份或在其他设备导入。
          </p>
          <div className="saved-list">
            {!saved.length && (
              <div className="empty-state">
                <Heart size={30} />
                <p>还没有收藏的旅程</p>
                <small>先规划一段旅程，再点击“保存旅程”。</small>
              </div>
            )}
            {saved.map((s) => (
              <div className="saved-item" key={s.id}>
                <div>
                  <strong>{s.name}</strong>
                  <small>
                    {new Date(s.savedAt).toLocaleDateString("zh-CN")} ·{" "}
                    {s.plan.stops.length} 座城市
                  </small>
                </div>
                <button
                  className="text-button"
                  onClick={() => {
                    setPlan(normalizePlan(s.plan, cities));
                    setActiveStop(0);
                    setView("planner");
                    setModal(null);
                    setToast("已打开保存的旅程");
                  }}
                >
                  打开
                  <ArrowRight size={14} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"删除" + s.name}
                  onClick={() => {
                    const next = saved.filter((x) => x.id !== s.id);
                    setSaved(next);
                    persist("tusuan-saved", next);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => importRef.current.click()}
            >
              <Plus size={15} />
              导入旅程
            </button>
            <button
              className="primary-button"
              onClick={() =>
                download(
                  "途算-旅程.json",
                  JSON.stringify({ version: 1, plan }, null, 2),
                )
              }
            >
              <ArrowDownToLine size={15} />
              导出当前旅程
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "compare" && (
        <Modal
          title="换个地方，生活要花多少钱？"
          onClose={() => setModal(null)}
          wide
        >
          <p className="muted small">
            每人预算，按 2 人合住 1
            间房估算；不含往返交通、门票、签证及押金。租金月预算按 30 天。
          </p>
          <div className="comparison-grid">
            {compare.map((id) => {
              const c = cityById(id);
              return (
                <div key={id} className="comparison-city">
                  <Photo image={c.image} alt={c.name} />
                  <h3>
                    {c.name}
                    <small>{c.country}</small>
                  </h3>
                  {[0, 1, 2].map((t) => (
                    <div className="comparison-stat" key={t}>
                      <span>
                        {TIERS[t].name}
                        <small>旅行 / 人 / 天</small>
                      </span>
                      <strong>
                        {money(
                          convert(
                            c.daily.lodging[t] / 2 +
                              c.daily.food[t] +
                              c.daily.transport[t] +
                              c.daily.misc[t],
                            c.currency,
                            plan.currency,
                            rates,
                          ),
                          plan.currency,
                        )}
                      </strong>
                    </div>
                  ))}
                  <div className="comparison-stay">
                    <span>舒适旅居 · 每人每月</span>
                    <strong>
                      {money(
                        convert(
                          (c.monthly.rent[1] + c.monthly.utilities[1]) / 2 +
                            (c.daily.food[1] +
                              c.daily.transport[1] +
                              c.daily.misc[1]) *
                              30,
                          c.currency,
                          plan.currency,
                          rates,
                        ),
                        plan.currency,
                      )}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="small muted">
            这些数字是规划参考，不是统计调查结果或供应商报价。可在旅程中逐项替换为你查到的实际费用。
          </p>
        </Modal>
      )}
    </div>
  );
}

function SaveModal({ onClose, onSave, defaultName }) {
  const [name, setName] = useState(defaultName);
  return (
    <Modal title="给这段旅程起个名字" onClose={onClose}>
      <label className="field-label" htmlFor="trip-name">
        旅程名称
      </label>
      <input
        id="trip-name"
        className="large-input"
        autoFocus
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSave(name.trim());
        }}
      />
      <p className="small muted">行程、预算与已核对金额都会一起保存。</p>
      <div className="modal-actions">
        <button
          className="primary-button"
          disabled={!name.trim()}
          onClick={() => onSave(name.trim())}
        >
          <Save size={16} />
          保存旅程
        </button>
      </div>
    </Modal>
  );
}
