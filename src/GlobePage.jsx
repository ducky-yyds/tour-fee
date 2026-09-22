import React, { useEffect, useMemo, useRef, useState } from "react";
import { assetUrl } from "./api.mjs";
import { feature } from "topojson-client";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  Check,
  Compass,
  Flag,
  Globe2,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Route,
  Search,
  Upload,
  X,
} from "lucide-react";
import { ISO2_TO_NUMERIC } from "../shared/country-codes.mjs";
import {
  normalizePlaceSearch,
  normalizeRotation,
  projectRoute,
  rotationForCity,
} from "../shared/globe.mjs";
import {
  PASSPORT_KEY,
  localDate,
  mergePassports,
  passportStats,
  validatePassport,
} from "../shared/passport.mjs";
import { convertCurrency } from "../shared/planner.mjs";
import { Photo, download, money } from "./ui.jsx";
import "./globe.css";
import EarthGlobe from "./EarthGlobe.jsx";

const MODES = [
  { id: "explore", label: "探索目的地", icon: Compass },
  { id: "routes", label: "项目路线", icon: Route },
  { id: "passport", label: "我的足迹", icon: Flag },
];
const emptyPassport = () => ({ version: 1, visits: [] });
const today = () => localDate();
const numericCode = (value) => String(value ?? "").padStart(3, "0");
function hasTravelData(city) {
  return (
    city?.coverage !== "airport-only" &&
    (Boolean(city.attractions?.length || city.experiences?.length) ||
      Object.values(city.daily || {}).some(
        (values) =>
          Array.isArray(values) && values.some((value) => Number(value) > 0),
      ))
  );
}
function readPassport(cities) {
  try {
    const stored = localStorage.getItem(PASSPORT_KEY);
    return {
      data: stored
        ? validatePassport(JSON.parse(stored), cities, today())
        : emptyPassport(),
      error: "",
    };
  } catch {
    return {
      data: emptyPassport(),
      error:
        "本机足迹暂时无法读取。原记录未改动；可尝试导入之前导出的足迹文件。",
    };
  }
}
function budgetLabel(city, currency, rates) {
  if (!city) return "";
  if (city.coverage === "airport-only" || !city.daily) return "生活成本待补充";
  const total = (tier) =>
    ["lodging", "food", "transport", "misc"].reduce(
      (sum, key) => sum + Number(city.daily?.[key]?.[tier] || 0),
      0,
    );
  try {
    return `${money(convertCurrency(total(0), city.currency, currency, rates), currency)} – ${money(convertCurrency(total(1), city.currency, currency, rates), currency)}`;
  } catch {
    return `${money(total(0), city.currency)} – ${money(total(1), city.currency)}`;
  }
}

export default function GlobePage({
  cities,
  rates,
  currency = "CNY",
  projects = [],
  activeProjectId,
  onOpenCity,
  onAddCity,
  onOpenProject,
  onToast,
}) {
  const travelCities = useMemo(() => cities.filter(hasTravelData), [cities]);
  const travelCityIds = useMemo(
    () => new Set(travelCities.map((city) => city.id)),
    [travelCities],
  );
  const initialCity =
    travelCities.find((city) => city.id === "shanghai") ||
    travelCities[0] ||
    cities[0];
  const [mode, setMode] = useState("explore");
  const [showAllCities, setShowAllCities] = useState(false);
  const [selectedId, setSelectedId] = useState(initialCity?.id || "");
  const [rotation, setRotation] = useState(() => rotationForCity(initialCity));
  const [zoom, setZoom] = useState(1);
  const [query, setQuery] = useState("");
  const [resultLimit, setResultLimit] = useState(36);
  const [projectId, setProjectId] = useState(
    activeProjectId || projects[0]?.id || "",
  );
  const [countries, setCountries] = useState([]);
  const [mapError, setMapError] = useState(false);
  const initialPassport = useMemo(() => readPassport(cities), []);
  const [passport, setPassport] = useState(initialPassport.data);
  const [passportError, setPassportError] = useState(initialPassport.error);
  const [visitDate, setVisitDate] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const importRef = useRef(null);
  const selected = cities.find((city) => city.id === selectedId) || initialCity;
  const selectedProject =
    projects.find((project) => project.id === projectId) ||
    projects.find((project) => project.id === activeProjectId) ||
    projects[0];
  const route = useMemo(
    () => projectRoute(selectedProject, cities),
    [selectedProject, cities],
  );
  const visited = useMemo(
    () => new Map(passport.visits.map((visit) => [visit.cityId, visit])),
    [passport],
  );
  const stats = useMemo(
    () => passportStats(passport, cities),
    [passport, cities],
  );
  const scopeCities = showAllCities ? cities : travelCities;
  const scopeCountries = useMemo(
    () =>
      new Set(scopeCities.map((city) => city.countryCode || city.country)).size,
    [scopeCities],
  );
  const contextCities = useMemo(() => {
    if (showAllCities) return [];
    const ids =
      mode === "routes"
        ? new Set(route.stops.map((stop) => stop.city.id))
        : mode === "passport"
          ? new Set(passport.visits.map((visit) => visit.cityId))
          : new Set();
    return cities.filter(
      (city) => ids.has(city.id) && !travelCityIds.has(city.id),
    );
  }, [showAllCities, mode, route, passport, cities, travelCityIds]);
  const mapCities = useMemo(
    () => (showAllCities ? cities : [...travelCities, ...contextCities]),
    [showAllCities, cities, travelCities, contextCities],
  );
  const visitedCountries = useMemo(
    () =>
      new Set(
        stats.countryCodes.map((code) => numericCode(ISO2_TO_NUMERIC[code])),
      ),
    [stats],
  );
  const matchingCities = useMemo(() => {
    const term = normalizePlaceSearch(query);
    return scopeCities.filter(
      (city) =>
        !term ||
        normalizePlaceSearch(
          `${city.id} ${city.name} ${city.nameEn} ${city.country} ${city.region} ${(city.tags || []).join(" ")} ${city.iata || ""} ${(city.airportCodes || []).join(" ")} ${city.subdivision || ""}`,
        ).includes(term),
    );
  }, [scopeCities, query]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(assetUrl("/maps/countries-110m.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("map");
        return response.json();
      })
      .then((topology) => {
        const object =
          topology.objects.countries || Object.values(topology.objects)[0];
        setCountries(feature(topology, object).features);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setMapError(true);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (activeProjectId) setProjectId(activeProjectId);
  }, [activeProjectId]);
  useEffect(() => {
    const visit = visited.get(selectedId);
    setVisitDate(visit?.visitedOn || "");
    setNote(visit?.note || "");
  }, [selectedId, visited]);
  useEffect(() => {
    if (
      !showAllCities &&
      !travelCityIds.has(selectedId) &&
      !contextCities.some((city) => city.id === selectedId) &&
      initialCity
    ) {
      setSelectedId(initialCity.id);
      setRotation(rotationForCity(initialCity));
    }
  }, [showAllCities, travelCityIds, selectedId, contextCities, initialCity]);

  function announce(message) {
    setStatus(message);
    onToast?.(message);
  }
  function chooseCity(city, focus = true) {
    setSelectedId(city.id);
    if (focus) setRotation(rotationForCity(city));
  }
  function changeCityScope(checked) {
    setShowAllCities(checked);
    setQuery("");
    setResultLimit(36);
    if (!checked && !travelCityIds.has(selectedId) && initialCity)
      chooseCity(initialCity);
  }
  function changeMode(next) {
    setMode(next);
    if (next === "routes" && route.stops[0]) chooseCity(route.stops[0].city);
    if (next === "passport" && passport.visits.length)
      chooseCity(
        cities.find((city) => city.id === passport.visits[0].cityId) ||
          selected,
      );
  }
  function savePassport(next, message) {
    try {
      const checked = validatePassport(next, cities, today());
      localStorage.setItem(PASSPORT_KEY, JSON.stringify(checked));
      setPassport(checked);
      setPassportError("");
      announce(message);
      return true;
    } catch (error) {
      setPassportError(
        error instanceof Error
          ? error.message
          : "足迹保存失败，请检查浏览器的存储空间。",
      );
      return false;
    }
  }
  function saveVisit() {
    const entry = { cityId: selected.id, visitedOn: visitDate, note };
    const next = {
      version: 1,
      visits: [
        ...passport.visits.filter((visit) => visit.cityId !== selected.id),
        entry,
      ],
    };
    savePassport(next, `已保存 ${selected.name} 的足迹`);
  }
  function removeVisit() {
    savePassport(
      {
        version: 1,
        visits: passport.visits.filter((visit) => visit.cityId !== selected.id),
      },
      `已取消 ${selected.name} 的打卡`,
    );
  }
  async function importPassport(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setPassportError("足迹文件不能超过 1 MB。");
      return;
    }
    try {
      const incoming = validatePassport(
        JSON.parse(await file.text()),
        cities,
        today(),
      );
      const merged = mergePassports(passport, incoming, cities, today());
      savePassport(
        merged,
        `已合并 ${incoming.visits.length} 条足迹，同一城市以导入记录为准`,
      );
    } catch (error) {
      setPassportError(
        error instanceof SyntaxError
          ? "文件不是有效的 JSON，原足迹已保留。"
          : error.message,
      );
    }
  }

  return (
    <main className="gl-page" aria-labelledby="gl-page-title">
      <div className="gl-page-heading">
        <div>
          <span className="gl-eyebrow">
            <Globe2 size={15} /> WORLD EXPLORER
          </span>
          <h1 id="gl-page-title">把下一站，放在地球上。</h1>
          <p>转动世界，串起想去的地方，也留住已经走过的足迹。</p>
        </div>
        <div className="gl-catalog-stat">
          <strong>{scopeCities.length.toLocaleString("en-US")}</strong>
          <span>{showAllCities ? "个目的地" : "个旅行资料城市"}</span>
          <i />
          <strong>{scopeCountries}</strong>
          <span>个国家与地区</span>
        </div>
      </div>
      <div className="gl-mode-row">
        <div className="gl-modes" aria-label="环球探索视图">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              className={mode === id ? "is-active" : ""}
              onClick={() => changeMode(id)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </div>
        <span className="gl-mode-hint">
          {mode === "explore"
            ? "让好奇心决定下一站"
            : mode === "routes"
              ? "规划中的连接，尚未成行的期待"
              : "每一个坐标，都属于你的故事"}
        </span>
      </div>
      <div className="gl-city-scope">
        <p>
          {showAllCities
            ? "全球城市与机场地点；部分目的地的旅行资料仍待补充。"
            : "优先探索已有景点、体验或生活成本资料的城市。"}
        </p>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={showAllCities}
            onChange={(event) => changeCityScope(event.target.checked)}
          />
          <span className="gl-scope-switch" aria-hidden="true" />
          <span>显示全部城市</span>
        </label>
      </div>
      {contextCities.length > 0 && (
        <p className="gl-context-note" role="status">
          {mode === "routes" ? "当前项目路线" : "已有足迹"}另展示{" "}
          {contextCities.length}{" "}
          个资料待补充的机场节点；搜索与城市计数仍按上方范围显示。
        </p>
      )}
      <div className="gl-workspace">
        <div className="gl-world-column">
          <div
            className="gl-world"
            data-testid="world-globe"
            data-rotation={rotation.join(",")}
            data-zoom={zoom.toFixed(2)}
          >
            <div className="gl-world-top">
              <span>
                <span className="gl-live-dot" />
                {mode === "routes"
                  ? "我的旅行地图"
                  : mode === "passport"
                    ? "我的足迹地图"
                    : "世界就在眼前"}
              </span>
              <span>
                {mode === "passport"
                  ? `${stats.countries} 个国家与地区已踏足`
                  : "卫星地表 · 悬停预览"}
              </span>
            </div>
            <EarthGlobe
              cities={mapCities}
              selectedId={selectedId}
              selected={selected}
              rotation={rotation}
              setRotation={setRotation}
              zoom={zoom}
              setZoom={setZoom}
              countries={countries}
              visited={visited}
              visitedCountries={visitedCountries}
              mode={mode}
              route={route}
              onSelect={chooseCity}
              budgetLabel={(city) => budgetLabel(city, currency, rates)}
            />
            <div className="gl-world-bottom">
              <div className="gl-map-legend">
                <span>
                  <i className={mode === "passport" ? "is-gold" : ""} />
                  {mode === "passport"
                    ? "去过的国家与地区"
                    : mode === "routes"
                      ? "所选旅行的路线"
                      : "可探索的目的地"}
                </span>
                {mode === "routes" && <small>示意连接，不代表实际航班</small>}
              </div>
              <div className="gl-zoom-controls">
                <button
                  type="button"
                  aria-label="缩小地球"
                  onClick={() => setZoom((value) => Math.max(0.7, value - 0.2))}
                  disabled={zoom <= 0.7}
                >
                  <Minus size={16} />
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  aria-label="放大地球"
                  onClick={() => setZoom((value) => Math.min(4.6, value + 0.2))}
                  disabled={zoom >= 4.6}
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  aria-label="重置地球视角"
                  onClick={() => {
                    setRotation(rotationForCity(selected));
                    setZoom(1);
                  }}
                >
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
            {mapError && (
              <p className="gl-map-error" role="status">
                陆地底图加载失败，仍可搜索城市、查看路线和管理足迹。
              </p>
            )}
          </div>
          <div className="gl-map-instructions" id="gl-map-help">
            <span>悬停城市看一眼 · 拖动旋转 · 点击后滚轮缩放</span>
            <div className="gl-turn-controls">
              {[
                [ArrowLeft, "向左旋转地球", -15, 0],
                [ArrowRight, "向右旋转地球", 15, 0],
                [ArrowUp, "向上旋转地球", 0, -10],
                [ArrowDown, "向下旋转地球", 0, 10],
              ].map(([Icon, label, x, y]) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  onClick={() =>
                    setRotation((value) =>
                      normalizeRotation([value[0] + x, value[1] + y, 0]),
                    )
                  }
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>
          <div className="gl-search-panel">
            <label htmlFor="gl-city-search">
              <Search size={17} />
              <input
                id="gl-city-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setResultLimit(36);
                }}
                placeholder="搜索城市、国家、机场代码，或海岛、极光…"
                autoComplete="off"
              />
              {query && (
                <button
                  type="button"
                  aria-label="清除目的地搜索"
                  onClick={() => setQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </label>
            <div className="gl-search-caption">
              <span>
                {query
                  ? `找到 ${matchingCities.length} 个目的地`
                  : showAllCities
                    ? "从一个好奇的名字开始"
                    : "从一个资料齐备的目的地开始"}
              </span>
              <span>点击名称，定位到地球上</span>
            </div>
            <div className="gl-city-results" aria-label="目的地搜索结果">
              {matchingCities.slice(0, resultLimit).map((city) => (
                <button
                  key={city.id}
                  type="button"
                  aria-pressed={selectedId === city.id}
                  onClick={() => chooseCity(city)}
                >
                  <span>
                    {visited.has(city.id) ? (
                      <Check size={12} />
                    ) : (
                      <MapPin size={12} />
                    )}
                    {city.name}
                  </span>
                  <small>{city.country}</small>
                </button>
              ))}
              {!matchingCities.length && (
                <p>没有匹配的目的地，试试国家名或英文城市名。</p>
              )}
            </div>
            {matchingCities.length > resultLimit && (
              <button
                className="gl-more-results"
                type="button"
                onClick={() => setResultLimit((value) => value + 36)}
              >
                查看更多 · 已展示 {Math.min(resultLimit, matchingCities.length)}{" "}
                / {matchingCities.length}
              </button>
            )}
          </div>
        </div>
        <aside className="gl-sidebar" aria-label="所选目的地">
          {selected && (
            <div className="gl-city-card">
              <div className="gl-city-photo">
                {selected.coverage === "airport-only" &&
                !selected.image?.url ? (
                  <div className="gl-airport-photo">
                    <Globe2 size={50} />
                    <p>{selected.iata || selected.countryCode}</p>
                    <small>机场目的地 · 景观图片待补充</small>
                  </div>
                ) : (
                  <Photo
                    image={selected.image}
                    alt={`${selected.name}城市风景`}
                  />
                )}
                <span>
                  {selected.region} · {selected.country}
                </span>
                {visited.has(selected.id) && (
                  <span className="gl-visited-badge">
                    <Check size={13} />
                    已踏足
                  </span>
                )}
              </div>
              <div className="gl-city-body">
                <p className="gl-city-english">{selected.nameEn}</p>
                <h2>{selected.name}</h2>
                <p className="gl-city-tagline">
                  {selected.tagline ||
                    selected.description ||
                    (selected.coverage === "airport-only"
                      ? "从机场出发，继续探索这座城市。"
                      : "")}
                </p>
                <div className="gl-city-tags">
                  {(selected.tags || []).slice(0, 3).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="gl-budget">
                  <span>
                    {selected.coverage === "airport-only"
                      ? "目的地基础资料"
                      : "日常旅行预算 · 经济至舒适"}
                  </span>
                  <strong>
                    {budgetLabel(selected, currency, rates)}
                    {selected.coverage !== "airport-only" && (
                      <small> / 天</small>
                    )}
                  </strong>
                  {selected.coverage === "airport-only" ? (
                    <p>
                      已收录{" "}
                      {selected.airportCount ||
                        selected.airportIds?.length ||
                        1}{" "}
                      个机场
                      {selected.airportCodes?.length
                        ? ` · ${selected.airportCodes.slice(0, 4).join(" / ")}`
                        : ""}
                      。地图坐标为机场位置，食宿、景点与照片资料正在补充。
                    </p>
                  ) : (
                    <p>1 人独住，含食宿、交通与杂项的估算；不含机票和门票。</p>
                  )}
                </div>
                <div className="gl-city-actions">
                  <button
                    className="gl-primary"
                    type="button"
                    onClick={() => onOpenCity?.(selected.id)}
                  >
                    {selected.coverage === "airport-only"
                      ? "查看目的地资料"
                      : "探索城市主页"}
                    <ArrowUpRight size={16} />
                  </button>
                  <button
                    className="gl-secondary"
                    type="button"
                    onClick={() => onAddCity?.(selected.id)}
                  >
                    <Plus size={16} />
                    加入当前旅行
                  </button>
                  <p className="gl-active-project-note">
                    当前项目：
                    {projects.find((project) => project.id === activeProjectId)
                      ?.name || "我的旅行"}
                  </p>
                </div>
              </div>
            </div>
          )}
          {mode === "routes" ? (
            <div className="gl-panel gl-project-panel">
              <span className="gl-eyebrow">YOUR NEXT JOURNEY</span>
              <h3>把计划串成一条线</h3>
              {projects.length ? (
                <>
                  <label htmlFor="gl-project">显示哪个旅行项目</label>
                  <select
                    id="gl-project"
                    value={selectedProject?.id || ""}
                    onChange={(event) => {
                      setProjectId(event.target.value);
                      const next = projectRoute(
                        projects.find(
                          (project) => project.id === event.target.value,
                        ),
                        cities,
                      );
                      if (next.stops[0]) chooseCity(next.stops[0].city);
                    }}
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <p>
                    {route.stops.filter((stop) => stop.kind === "stop").length}{" "}
                    个目的地 · {route.totalDays} 天
                    {selectedProject?.plan?.departureDate
                      ? ` · ${selectedProject.plan.departureDate} 出发`
                      : ""}
                  </p>
                  <button
                    type="button"
                    className="gl-text-action"
                    onClick={() => onOpenProject?.(selectedProject.id)}
                  >
                    继续规划这个项目
                    <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <p>先建立一个旅行项目，再来这里查看目的地之间的连接。</p>
              )}
              <small>
                连线沿球面连接城市，交通方式、班次与实际行驶路线请在旅行规划中核对。
              </small>
            </div>
          ) : (
            <div className="gl-panel gl-visit-panel">
              <span className="gl-eyebrow">MY TRAVEL PASSPORT</span>
              <h3>
                {visited.has(selectedId)
                  ? "这一站，已经成为故事"
                  : "这一站，你到过吗？"}
              </h3>
              <p>手动记录真实到访，旅行计划不会自动计入足迹。</p>
              <label htmlFor="gl-visit-date">
                首次到访日期 <span>选填</span>
              </label>
              <input
                id="gl-visit-date"
                type="date"
                min="1900-01-01"
                max={today()}
                value={visitDate}
                onChange={(event) => setVisitDate(event.target.value)}
              />
              <label htmlFor="gl-visit-note">
                留下一点回忆 <span>选填</span>
              </label>
              <textarea
                id="gl-visit-note"
                rows={2}
                maxLength={200}
                value={note}
                placeholder="例如：第一次看见北极光的夜晚"
                onChange={(event) => setNote(event.target.value)}
              />
              <div className="gl-visit-actions">
                <button
                  type="button"
                  className="gl-primary"
                  onClick={saveVisit}
                >
                  <Flag size={15} />
                  {visited.has(selectedId) ? "保存足迹" : "标记为已去过"}
                </button>
                {visited.has(selectedId) && (
                  <button
                    type="button"
                    className="gl-remove"
                    onClick={removeVisit}
                  >
                    取消打卡
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
      {mode === "routes" && (
        <div className="gl-panel gl-route-panel">
          <div className="gl-section-heading">
            <div>
              <span className="gl-eyebrow">A JOURNEY IN THE MAKING</span>
              <h2>{selectedProject?.name || "等待下一段旅程"}</h2>
            </div>
            <span>{route.legs.length} 段规划连接</span>
          </div>
          {route.stops.length ? (
            <ol className="gl-route-stops">
              {route.stops.map((stop, index) => (
                <li key={`${stop.kind}-${index}`}>
                  <button
                    type="button"
                    onClick={() => chooseCity(stop.city)}
                    className={selectedId === stop.city.id ? "is-active" : ""}
                  >
                    <span className="gl-stop-number">
                      {stop.kind === "origin" ? (
                        <MapPin size={14} />
                      ) : stop.kind === "return" ? (
                        <RotateCcw size={14} />
                      ) : (
                        index
                      )}
                    </span>
                    <div>
                      <strong>{stop.city.name}</strong>
                      <span>
                        {stop.kind === "origin" ? "出发地" : stop.label}
                        {stop.date
                          ? ` · ${stop.date.slice(5).replace("-", "/")}`
                          : ""}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p>在旅行项目中选择出发地和目的地，球面路线会自动出现。</p>
          )}
        </div>
      )}
      {mode === "passport" && (
        <div className="gl-panel gl-passport-panel">
          <div className="gl-section-heading">
            <div>
              <span className="gl-eyebrow">COLLECT MOMENTS, NOT MILES</span>
              <h2>你的世界，正在慢慢展开</h2>
            </div>
            <div className="gl-file-actions">
              <button
                type="button"
                onClick={() => {
                  download(
                    `tusuan-passport-${today()}.json`,
                    JSON.stringify(passport, null, 2),
                  );
                  announce("足迹文件已导出");
                }}
              >
                <ArrowDownToLine size={15} />
                导出足迹
              </button>
              <button type="button" onClick={() => importRef.current?.click()}>
                <Upload size={15} />
                导入足迹
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                onChange={importPassport}
                hidden
                aria-label="导入足迹 JSON 文件"
              />
            </div>
          </div>
          <div className="gl-passport-stats" data-testid="passport-stats">
            <div>
              <strong>{stats.cities}</strong>
              <span>个目的地已踏足</span>
            </div>
            <div>
              <strong>{stats.countries}</strong>
              <span>个国家与地区</span>
            </div>
            <div>
              <strong>
                {stats.cities}
                <small> / {stats.catalogCities}</small>
              </strong>
              <span>完整城市目录中的打卡覆盖</span>
            </div>
          </div>
          <p className="gl-passport-note">
            只统计本应用目录中的打卡目的地，地图高亮表示曾到访该国家或地区，不代表已探索全部区域。足迹保存在当前浏览器；导出文件可备份或迁移，导入会合并记录，同一城市以导入内容为准。
          </p>
          {passport.visits.length ? (
            <div className="gl-visited-list">
              {passport.visits.map((visit) => {
                const city = cities.find((item) => item.id === visit.cityId);
                return (
                  city && (
                    <button
                      type="button"
                      key={visit.cityId}
                      onClick={() => chooseCity(city)}
                    >
                      <Photo image={city.image} alt="" />
                      <span>
                        <strong>{city.name}</strong>
                        <small>{visit.visitedOn || city.country}</small>
                        {visit.note && <em>{visit.note}</em>}
                      </span>
                      <Check size={15} />
                    </button>
                  )
                );
              })}
            </div>
          ) : (
            <div className="gl-empty-passport">
              <Flag size={26} />
              <p>从第一次打卡开始，让这颗地球留下你的印记。</p>
            </div>
          )}
        </div>
      )}
      {passportError && (
        <p className="gl-error" role="alert">
          {passportError}
        </p>
      )}
      <span className="gl-sr-only" aria-live="polite">
        {status}
      </span>
      <p className="gl-attribution">
        地表与云层：
        <a
          href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/"
          target="_blank"
          rel="noopener noreferrer"
        >
          NASA Blue Marble
        </a>
        （历史合成影像） · 边界：
        <a
          href="https://www.naturalearthdata.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Natural Earth
        </a>{" "}
        ·
        缩放后显示更多城市；小岛与小型机场以坐标点呈现。城市图片署名见目的地主页。
      </p>
    </main>
  );
}
