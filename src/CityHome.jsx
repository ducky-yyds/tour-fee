import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  ExternalLink,
  Info,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { convertCurrency } from "../shared/planner.mjs";
import { getVisitDurationRange } from "../shared/itinerary.mjs";
import { getTripDuration, recommendedDays } from "../shared/trip-duration.mjs";
import { Photo, Modal, OutLink, money } from "./ui.jsx";
import CityBrief from "./CityBrief.jsx";
import LocalFoodGuide from "./LocalFoodGuide.jsx";
import SourceReferences from "./SourceReferences.jsx";
import DestinationSelect from "./DestinationSelect.jsx";
import "./city-home.css";

const TABS = [
  { id: "sights", name: "景点", short: "景点", icon: Compass },
  { id: "restaurant", name: "美食", short: "美食", icon: Utensils },
  { id: "hotel", name: "住宿", short: "住宿", icon: BedDouble },
  { id: "experience", name: "独特体验", short: "体验", icon: Sparkles },
];
const KIND_LABEL = {
  restaurant: "餐厅",
  hotel: "酒店",
  experience: "特色体验",
};
const asArray = (value) => (Array.isArray(value) ? value : []);
const safeUrl = (value) =>
  /^https?:\/\//i.test(value || "") ? value : undefined;
const dateLabel = (date) =>
  /^\d{4}-\d{2}-\d{2}/.test(date || "") ? date.slice(0, 10) : null;
const duration = (minutes) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ""}`
    : `${minutes} 分钟`;
const mealLabel = (meal) =>
  meal === "breakfast" ? "早餐" : meal === "lunch" ? "午餐" : "晚餐";
const priceUnit = (option) =>
  option.unit === "room-night"
    ? "间晚"
    : option.unit === "booking"
      ? `单（最多 ${option.partyCapacity} 人）`
      : "人";
// Presentation only: these places still use attraction selection and budgeting.
function isLocalExploration(item) {
  const price = item.price;
  const free =
    price &&
    price.low != null &&
    price.type !== "missing" &&
    !price.missingPrice &&
    Number(price.low) === 0 &&
    Number(price.high ?? price.low) === 0;
  return (
    free &&
    getVisitDurationRange(item).recommended <= 120 &&
    (item.visitRole === "neighborhood" ||
      /街区|街巷|市场|市集|广场|打卡|漫游|商业街|步行街/.test(
        item.category || "",
      ))
  );
}
function initialDraft(city, plan) {
  const stop = plan?.stops?.find((item) => item.cityId === city.id);
  return {
    days: stop?.days || recommendedDays(city),
    daysSource: stop?.days ? stop.daysSource || "user" : "recommendation",
    attractionIds: [
      ...new Set([
        ...asArray(stop?.attractionIds),
        ...asArray(stop?.requestedAttractionIds).filter((id) =>
          asArray(stop?.deferredAttractionIds).includes(id),
        ),
      ]),
    ],
    experienceSelections: asArray(stop?.experienceSelections).map((item) => ({
      ...item,
    })),
  };
}
function converted(amount, from, currency, rates) {
  try {
    return convertCurrency(Number(amount) || 0, from, currency, rates);
  } catch {
    return null;
  }
}
function rangeText(low, high, currency) {
  return low === high
    ? money(low, currency)
    : `${money(low, currency)} – ${money(high, currency)}`;
}
function Price({ price, currency, rates, unit = "人", compact = false }) {
  if (
    !price ||
    price.low == null ||
    price.type === "missing" ||
    price.missingPrice ||
    !Number.isFinite(Number(price.low))
  )
    return <span className="ch-price-pending">价格待核实</span>;
  const from = price.currency || currency;
  const lo = converted(price.low, from, currency, rates);
  const hi = converted(price.high ?? price.low, from, currency, rates);
  return (
    <div className={`ch-price ${compact ? "is-compact" : ""}`}>
      <div>
        <strong>
          {lo === null || hi === null
            ? rangeText(price.low, price.high ?? price.low, from)
            : rangeText(lo, hi, currency)}
        </strong>
        <span> / {unit}</span>
      </div>
      {from !== currency && (
        <small>
          {rangeText(price.low, price.high ?? price.low, from)} · 原币
          {lo === null ? "，换算汇率暂缺" : ""}
        </small>
      )}
    </div>
  );
}
function PriceSource({ price, sourceUrl, sourceLabel }) {
  const checked = dateLabel(price?.checkedAt);
  const official = price?.type === "official" && checked;
  const url = safeUrl(price?.sourceUrl || sourceUrl);
  return (
    <div className="ch-price-source">
      <span className={official ? "is-verified" : ""}>
        {official
          ? `官方价格 · 核验 ${checked}`
          : price?.type === "missing" || price?.missingPrice
            ? "入场费用待补充"
            : price?.type === "user"
              ? "用户填写预算"
              : "参考预算 · 非实时售价"}
      </span>
      {url && (
        <OutLink href={url}>
          {official ? "价格来源" : sourceLabel || "商家与查询来源"}
        </OutLink>
      )}
    </div>
  );
}
function ImageCredit({ image, inline = false }) {
  return safeUrl(image?.sourceUrl) ? (
    <div className={`ch-image-credit${inline ? " is-inline" : ""}`}>
      <a
        href={safeUrl(image.attributionUrl) || image.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`${image.credit || "图片来源"}；缩略图，界面可能裁切`}
      >
        {image.credit || "图片来源"}
      </a>
      {safeUrl(image.attributionUrl) && <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">原图</a>}
      {image.license && (
        <a
          href={safeUrl(image.licenseUrl) || image.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {image.license}
        </a>
      )}
    </div>
  ) : null;
}
function placeMedia(item, city, sight) {
  const related =
    !sight && typeof item.imageRef === "string"
      ? city.attractions?.find((a) => a.id === item.imageRef)
      : null;
  const image = item.image?.url
    ? item.image
    : related?.image?.url
      ? related.image
      : undefined;
  const context =
    image?.contextNote ||
    (image?.scope === "illustration"
      ? "插画示意，用于介绍这一地点的氛围。"
      : image?.scope === "nearby"
        ? "周边实景，画面不代表该地点本身。"
        : !item.image?.url && related?.image?.url
          ? `周边实景：${related.name}，画面不代表该商家本身。`
          : null);
  return { image, context };
}
function PlaceImage({ item, city, sight = false, className = "" }) {
  const { image, context } = placeMedia(item, city, sight);
  return (
    <div className={`ch-place-photo ${className}`}>
      <Photo
        image={image}
        alt={context ? `${item.name} · ${context}` : item.name}
      />
    </div>
  );
}
function PlaceMediaDetails({ item, city, sight = false }) {
  const { image, context } = placeMedia(item, city, sight);
  return (
    <div className="ch-media-details">
      {context && <p>{context}</p>}
      <ImageCredit image={image} inline />
    </div>
  );
}
function PlaceSourceDetails({ item }) {
  const osm =
    item.sourceProvider === "openstreetmap" || item.license === "ODbL-1.0";
  return (
    <>
      {osm && (
        <p className="ch-detail-note">
          {item.kind === "hotel"
            ? "住宿信息来自 OpenStreetMap，营业状态、房态和设施尚未独立核实。"
            : "地点资料来自 OpenStreetMap；地图收录不代表已核实营业、服务或当日入场条件。"}
        </p>
      )}
      {item.verificationNote && (
        <p className="ch-detail-note">{item.verificationNote}</p>
      )}
      <SourceReferences references={item.sourceReferences} excludeUrls={[item.sourceUrl, item.price?.sourceUrl]} />
      {osm && (
        <OutLink href="https://www.openstreetmap.org/copyright">
          © OpenStreetMap contributors
        </OutLink>
      )}
    </>
  );
}

export default function CityHome({
  city,
  cities = [],
  plan,
  rates,
  onBack,
  onSelectCity,
  onGenerate,
  onToast,
}) {
  const drafts = useRef(new Map());
  const currentCity = useRef(city.id);
  const [draft, setDraft] = useState(() => initialDraft(city, plan));
  const [tab, setTab] = useState("sights");
  const [diningView, setDiningView] = useState("foods");
  const [experienceView, setExperienceView] = useState("all");
  const [visitFilter, setVisitFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(12);
  const [detail, setDetail] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [daysText, setDaysText] = useState(String(draft.days));
  const [dayError, setDayError] = useState("");
  const catalogRef = useRef(null);
  const basketRef = useRef(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    if (currentCity.current === city.id) return;
    drafts.current.set(currentCity.current, draftRef.current);
    currentCity.current = city.id;
    const next = drafts.current.get(city.id) || initialDraft(city, plan);
    setDraft(next);
    setDaysText(String(next.days));
    setTab("sights");
    setDiningView("foods");
    setExperienceView("all");
    setVisitFilter("all");
    setQuery("");
    setCategory("all");
    setDetail(null);
    setDayError("");
  }, [city.id]);
  useEffect(
    () => setVisible(12),
    [tab, query, category, visitFilter, experienceView, city.id],
  );
  const currency = plan?.currency || "CNY";
  const people = plan?.travelers || 1;
  const rooms = plan?.rooms || 1;
  const stopIndex =
    plan?.stops?.findIndex((stop) => stop.cityId === city.id) ?? -1;
  const isFinalStop = stopIndex < 0 || stopIndex === plan.stops.length - 1;
  const nights =
    plan?.mode === "stay"
      ? draft.days
      : Math.max(0, draft.days - (isFinalStop ? 1 : 0));
  const sights = asArray(city.attractions);
  const experiences = asArray(city.experiences);
  const sightIds = new Set(sights.map((item) => item.id));
  const localExplorations = sights.filter(isLocalExploration);
  const catalogSights = sights.filter((item) => !isLocalExploration(item));
  const bookableExperiences = experiences.filter(
    (item) => item.kind === "experience",
  );
  const selectedIds = new Set(draft.attractionIds);
  const selectedSights = sights.filter((a) => selectedIds.has(a.id));
  const resolved = draft.experienceSelections
    .map((selection) => {
      const experience = experiences.find(
        (item) => item.id === selection.experienceId,
      );
      const option = experience?.priceOptions?.find(
        (item) => item.id === selection.optionId,
      );
      return experience && option ? { selection, experience, option } : null;
    })
    .filter(Boolean);
  const categories = [
    ...new Set(catalogSights.map((a) => a.category).filter(Boolean)),
  ];
  const sourceList =
    tab === "sights"
      ? catalogSights
      : tab === "experience"
        ? experienceView === "places"
          ? localExplorations
          : experienceView === "bookable"
            ? bookableExperiences
            : [...bookableExperiences, ...localExplorations]
        : experiences.filter((a) => a.kind === tab);
  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return sourceList.filter(
      (a) =>
        (tab !== "sights" || category === "all" || a.category === category) &&
        (tab !== "sights" ||
          visitFilter === "all" ||
          (visitFilter === "optional"
            ? a.visitRole === "optional" || a.automaticPlanning === false
            : visitFilter === "neighborhood"
              ? a.visitRole === "neighborhood"
              : a.visitRole !== "optional" &&
                a.visitRole !== "neighborhood" &&
                a.automaticPlanning !== false)) &&
        (!q ||
          [
            a.name,
            a.nameEn,
            a.description,
            a.provider,
            a.tagline,
            ...asArray(a.features),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)),
    );
  }, [sourceList, query, category, visitFilter, tab]);
  const passGroups = new Map();
  for (const sight of selectedSights)
    if (sight.price.passGroup)
      passGroups.set(
        sight.price.passGroup,
        (passGroups.get(sight.price.passGroup) || 0) + 1,
      );
  const countedPasses = new Set();
  const subtotal = [
    ...selectedSights.flatMap((a) => {
      const group = a.price.passGroup;
      if (group && countedPasses.has(group)) return [];
      if (group) countedPasses.add(group);
      return [
        {
          price: a.price,
          quantity: people,
          maxQuantity: group
            ? people * Math.min(draft.days, passGroups.get(group))
            : people,
        },
      ];
    }),
    ...resolved.map(({ experience, option }) => ({
      price: option,
      quantity:
        experience.kind === "hotel"
          ? rooms * nights
          : option.unit === "booking"
            ? Math.ceil(people / option.partyCapacity)
            : people,
    })),
  ].reduce(
    (sum, { price, quantity, maxQuantity = quantity }) => {
      if (!price || price.type === "missing" || price.missingPrice)
        return { ...sum, incomplete: true };
      const lo = converted(
        price.low,
        price.currency || city.currency,
        currency,
        rates,
      );
      const hi = converted(
        price.high ?? price.low,
        price.currency || city.currency,
        currency,
        rates,
      );
      return {
        low: sum.low + (lo || 0) * quantity,
        high: sum.high + (hi || 0) * maxQuantity,
        incomplete: sum.incomplete || lo === null || hi === null,
      };
    },
    { low: 0, high: 0, incomplete: false },
  );
  const totalSelected = selectedSights.length + resolved.length;
  const guide = city.guide || {};

  function changeDays(value, daysSource = "user") {
    const days = Number(value);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setDayError("请输入 1–365 之间的整数天数");
      return false;
    }
    setDayError("");
    if (draft.experienceSelections.some((item) => item.dayIndex >= days)) {
      setDayError("已有餐厅或体验安排在之后的日期，请先移除或调整这些项目");
      return false;
    }
    setDraft((previous) => ({ ...previous, days, daysSource }));
    return true;
  }
  function toggleSight(id) {
    setDraft((previous) => ({
      ...previous,
      attractionIds: previous.attractionIds.includes(id)
        ? previous.attractionIds.filter((a) => a !== id)
        : [...previous.attractionIds, id],
    }));
  }
  function selectExperience(experience, optionId, dayIndex, mealType) {
    const selection = {
      experienceId: experience.id,
      optionId,
      ...(dayIndex !== undefined ? { dayIndex } : {}),
      ...(experience.kind === "restaurant"
        ? { mealType: mealType || experience.mealType || "dinner" }
        : {}),
    };
    const replaced = draft.experienceSelections.some((existing) => {
      const item = experiences.find((a) => a.id === existing.experienceId);
      return (
        existing.experienceId !== experience.id &&
        ((experience.kind === "hotel" && item?.kind === "hotel") ||
          (experience.kind === "restaurant" &&
            item?.kind === "restaurant" &&
            (existing.dayIndex ?? 0) === (dayIndex ?? 0) &&
            (existing.mealType || item.mealType || "dinner") ===
              selection.mealType))
      );
    });
    setDraft((previous) => {
      const selections = previous.experienceSelections.filter((existing) => {
        const item = experiences.find((a) => a.id === existing.experienceId);
        const same = existing.experienceId === experience.id;
        const hotel = experience.kind === "hotel" && item?.kind === "hotel";
        const meal =
          experience.kind === "restaurant" &&
          item?.kind === "restaurant" &&
          (existing.dayIndex ?? 0) === (dayIndex ?? 0) &&
          (existing.mealType || item.mealType || "dinner") ===
            selection.mealType;
        return !(same || hotel || meal);
      });
      return { ...previous, experienceSelections: [...selections, selection] };
    });
    onToast?.(
      replaced
        ? experience.kind === "hotel"
          ? "已替换本城市的酒店选择"
          : "已替换同一天的这一餐"
        : `已加入${experience.name}，生成行程后统一核算`,
    );
  }
  function removeExperience(id) {
    setDraft((previous) => ({
      ...previous,
      experienceSelections: previous.experienceSelections.filter(
        (item) => item.experienceId !== id,
      ),
    }));
  }
  async function generate() {
    if (!changeDays(daysText, draft.daysSource)) return;
    setGenerating(true);
    try {
      await onGenerate?.({
        cityId: city.id,
        days: Number(daysText),
        daysSource: draft.daysSource,
        attractionIds: [...draft.attractionIds],
        experienceSelections: draft.experienceSelections.map((item) => ({
          ...item,
        })),
      });
    } catch (error) {
      onToast?.(error.message || "暂未生成成功，请重试");
    } finally {
      setGenerating(false);
    }
  }
  function goTab(id) {
    setTab(id);
    setExperienceView("all");
    setVisitFilter("all");
    setCategory("all");
    setQuery("");
  }

  return (
    <main className="city-home">
      <div className="ch-topbar">
        <button className="text-button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回城市列表
        </button>
        <div className="ch-city-switch ch-city-switch-visual">
          <DestinationSelect cities={cities} value={city.id}
            onChange={(id) => onSelectCity?.(id)} label="切换城市主页" />
        </div>
      </div>
      <section className="ch-hero" aria-label={`${city.name}城市指南`}>
        <Photo
          image={city.image}
          alt={`${city.name}城市实景`}
          loading="eager"
          className="ch-hero-photo"
        />
        <div className="ch-hero-shade" />
        <div className="ch-hero-content">
          <span className="ch-overline">A PLACE TO MAKE YOUR OWN</span>
          <div className="ch-hero-location">
            <MapPin size={14} />
            {city.country} · {city.region}
          </div>
          <h1>
            {city.name}
            <span>{city.nameEn}</span>
          </h1>
          <p>{city.tagline || city.description}</p>
          <div className="ch-hero-tags">
            {asArray(city.tags)
              .slice(0, 4)
              .map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
          </div>
          <button
            className="ch-hero-button"
            onClick={() =>
              catalogRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          >
            挑选属于你的城市时光
            <ArrowRight size={17} />
          </button>
        </div>
        <div className="ch-hero-index">
          <span>DESTINATION NOTES</span>
          <strong>
            {String(
              cities.findIndex((item) => item.id === city.id) + 1,
            ).padStart(2, "0")}
          </strong>
          <small> / {cities.length || 30}</small>
        </div>
        <ImageCredit image={city.image} />
      </section>
      <CityBrief
        key={city.id}
        city={city}
        onRestaurants={() => {
          goTab("restaurant");
          setDiningView("restaurants");
          catalogRef.current?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <div className="ch-content-layout">
        <section className="ch-catalog" ref={catalogRef}>
          <div className="ch-section-heading">
            <div>
              <span className="eyebrow">COLLECT YOUR LITTLE ADVENTURES</span>
              <h2>这一次，想怎样遇见{city.name}？</h2>
            </div>
            <span>
              {sights.length} 个去处 · {experiences.length} 个餐宿与体验
            </span>
          </div>
          <div className="ch-tabs" role="tablist" aria-label="城市体验分类">
            {TABS.map(({ id, name, short, icon: Icon }) => (
              <button
                key={id}
                id={`ch-tab-${id}`}
                role="tab"
                aria-selected={tab === id}
                aria-controls="ch-catalog-panel"
                tabIndex={tab === id ? 0 : -1}
                onClick={() => goTab(id)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const i = TABS.findIndex((item) => item.id === tab);
                    const next =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? TABS.length - 1
                          : (i +
                              (e.key === "ArrowRight" ? 1 : -1) +
                              TABS.length) %
                            TABS.length;
                    goTab(TABS[next].id);
                    document.getElementById(`ch-tab-${TABS[next].id}`)?.focus();
                  }
                }}
              >
                <Icon size={16} />
                <span className="ch-tab-long">{name}</span>
                <span className="ch-tab-short">{short}</span>
                <small>
                  {id === "sights"
                    ? catalogSights.length
                    : id === "restaurant"
                      ? experiences.filter((item) => item.kind === id).length +
                        (city.localFoods?.length || 0)
                      : id === "experience"
                        ? bookableExperiences.length + localExplorations.length
                        : experiences.filter((item) => item.kind === id).length}
                </small>
              </button>
            ))}
          </div>
          {tab === "restaurant" && (
            <div
              className="ch-dining-switch"
              role="group"
              aria-label="餐饮浏览方式"
            >
              <button
                type="button"
                aria-pressed={diningView === "foods"}
                onClick={() => setDiningView("foods")}
              >
                特色食物 <small>{city.localFoods?.length || 0}</small>
              </button>
              <button
                type="button"
                aria-pressed={diningView === "restaurants"}
                onClick={() => setDiningView("restaurants")}
              >
                餐厅与套餐{" "}
                <small>
                  {
                    experiences.filter((item) => item.kind === "restaurant")
                      .length
                  }
                </small>
              </button>
            </div>
          )}
          {tab === "experience" && (
            <div
              className="ch-dining-switch"
              role="group"
              aria-label="体验类型"
            >
              {[
                [
                  "all",
                  "全部",
                  bookableExperiences.length + localExplorations.length,
                ],
                ["places", "街区小逛", localExplorations.length],
                ["bookable", "预订项目", bookableExperiences.length],
              ].map(([id, label, count]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={experienceView === id}
                  onClick={() => setExperienceView(id)}
                >
                  {label}
                  <small>{count}</small>
                </button>
              ))}
            </div>
          )}
          {tab === "restaurant" && diningView === "foods" ? (
            <div
              id="ch-catalog-panel"
              role="tabpanel"
              aria-labelledby="ch-tab-restaurant"
            >
              <LocalFoodGuide city={city} />
            </div>
          ) : (
            <>
              {tab === "sights" && (
                <div
                  className="ch-visit-filters"
                  role="group"
                  aria-label="按游玩偏好筛选"
                >
                  {[
                    ["all", "所有去处"],
                    ["highlight", "经典与精选"],
                    ["neighborhood", "街区与小停留"],
                    ["optional", "按兴趣探索"],
                  ].map(([id, label]) => (
                    <button
                      type="button"
                      key={id}
                      aria-pressed={visitFilter === id}
                      onClick={() => setVisitFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <div className="ch-search-row">
                <label className="ch-search">
                  <Search size={17} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      tab === "sights"
                        ? "搜索景点、街区或感兴趣的事"
                        : "搜索名称、味道或服务特色"
                    }
                    aria-label="搜索城市项目"
                  />
                  {query && (
                    <button onClick={() => setQuery("")} aria-label="清除搜索">
                      <X size={14} />
                    </button>
                  )}
                </label>
                {tab === "sights" && (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="景点类型筛选"
                  >
                    <option value="all">所有类型</option>
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="ch-results-heading">
                <p>
                  {query || category !== "all"
                    ? `找到 ${filtered.length} 个项目`
                    : tab === "sights"
                      ? city.planningProfile === "leisure"
                        ? "留一个午后慢慢体验，生成时会为度假与休息留出时间。"
                        : "选喜欢的风景与当地体验，再按路线与时间安排。"
                      : tab === "restaurant"
                        ? "选定餐厅与套餐，对应餐次会替换基础餐饮预算。"
                        : tab === "hotel"
                          ? "一个城市选一间酒店，按房间数与停留晚数核算。"
                          : experienceView === "places"
                            ? "留一点时间逛街区、广场与市集，按去处加入行程。"
                            : guide.experienceIntro ||
                              "街区可以自由探索，商家项目按所选方案核算。"}
                </p>
                {tab === "sights" && filtered.length > 0 && (
                  <button
                    className="text-button"
                    onClick={() =>
                      setDraft((previous) => ({
                        ...previous,
                        attractionIds: [
                          ...new Set([
                            ...previous.attractionIds,
                            ...filtered.map((item) => item.id),
                          ]),
                        ],
                      }))
                    }
                  >
                    <Plus size={14} />
                    加入{query || category !== "all" ? "筛选结果" : "全部去处"}
                  </button>
                )}
              </div>
              <div
                id="ch-catalog-panel"
                role="tabpanel"
                aria-labelledby={`ch-tab-${tab}`}
              >
                <div
                  className={`ch-card-grid ${tab !== "sights" && !(tab === "experience" && experienceView === "places") ? "ch-experience-grid" : ""}`}
                >
                  {filtered
                    .slice(0, visible)
                    .map((item) =>
                      sightIds.has(item.id) ? (
                        <SightCard
                          key={item.id}
                          item={item}
                          city={city}
                          selected={selectedIds.has(item.id)}
                          currency={currency}
                          rates={rates}
                          onToggle={() => toggleSight(item.id)}
                          onDetails={() => setDetail({ kind: "sight", item })}
                        />
                      ) : (
                        <ExperienceCard
                          key={item.id}
                          item={item}
                          city={city}
                          selection={draft.experienceSelections.find(
                            (selected) => selected.experienceId === item.id,
                          )}
                          days={draft.days}
                          nights={nights}
                          currency={currency}
                          rates={rates}
                          people={people}
                          onSelect={(optionId, dayIndex, mealType) =>
                            selectExperience(item, optionId, dayIndex, mealType)
                          }
                          onRemove={() => removeExperience(item.id)}
                          onDetails={(optionId) =>
                            setDetail({ kind: "experience", item, optionId })
                          }
                        />
                      ),
                    )}
                </div>
                {!filtered.length && (
                  <div className="ch-empty">
                    <Search size={28} />
                    <h3>
                      {query || category !== "all"
                        ? "还没找到合适的项目"
                        : "这一页正在慢慢丰富"}
                    </h3>
                    <p>
                      {query || category !== "all"
                        ? "试试更短的关键词，或看看全部选择。"
                        : "可以先收藏景点，餐厅、酒店与更多体验将继续补充。"}
                    </p>
                    {(query || category !== "all") && (
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setQuery("");
                          setCategory("all");
                        }}
                      >
                        清除筛选
                      </button>
                    )}
                  </div>
                )}
                {filtered.length > visible && (
                  <button
                    className="secondary-button ch-load-more"
                    onClick={() => setVisible((n) => n + 12)}
                  >
                    继续发现 · 还有 {filtered.length - visible} 个
                    <ChevronDown size={15} />
                  </button>
                )}
              </div>
            </>
          )}
        </section>
        <aside
          className="ch-basket"
          aria-label="城市行程选择篮"
          ref={basketRef}
        >
          <div className="ch-basket-title">
            <span className="eyebrow">YOUR CITY, YOUR PACE</span>
            <h2>在{city.name}的日子</h2>
            <p>先挑喜欢的，再把时间排好。</p>
          </div>
          <label className="ch-days-label">
            <span>
              <CalendarDays size={16} />
              停留多久
            </span>
            <div>
              <input
                aria-label="城市停留天数"
                type="number"
                min="1"
                max="365"
                step="1"
                value={daysText}
                onChange={(e) => setDaysText(e.target.value)}
                onBlur={() => changeDays(daysText)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") changeDays(daysText);
                }}
              />
              <span>天</span>
            </div>
          </label>
          <div className="ch-duration-hint">
            <span>
              {getTripDuration(city).type === "provisional"
                ? "暂定"
                : "初次到访建议"}{" "}
              {getTripDuration(city).label}
            </span>
            <button
              className="text-button"
              onClick={() =>
                changeDays(recommendedDays(city), "recommendation")
              }
            >
              采用 {recommendedDays(city)} 天
            </button>
            <small>
              {getTripDuration(city).reason} 长途交通可能需要额外留出时间。
            </small>
          </div>
          {dayError && (
            <p className="ch-field-error" role="alert">
              {dayError}
            </p>
          )}
          <div className="ch-party">
            <span>
              <Users size={13} />
              {people} 位成人
            </span>
            <span>
              <BedDouble size={13} />
              {rooms} 间 · {nights} 晚
            </span>
          </div>
          <div className="ch-basket-list">
            <div className="ch-basket-list-title">
              <strong>已选 {totalSelected} 项</strong>
              {totalSelected > 0 && (
                <button
                  onClick={() =>
                    setDraft((previous) => ({
                      ...previous,
                      attractionIds: [],
                      experienceSelections: [],
                    }))
                  }
                >
                  清空选择
                </button>
              )}
            </div>
            {!totalSelected && (
              <p className="ch-basket-empty">
                一座城，有许多打开方式。
                <br />
                从左边选一个心动的去处。
              </p>
            )}
            {selectedSights.map((item) => (
              <div className="ch-basket-item" key={item.id}>
                <Compass size={14} />
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {duration(getVisitDurationRange(item).recommended)} ·
                    游览时长可调整
                  </small>
                </div>
                <button
                  aria-label={`移除${item.name}`}
                  onClick={() => toggleSight(item.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {resolved.map(({ selection, experience, option }) => (
              <div className="ch-basket-item" key={experience.id}>
                {experience.kind === "hotel" ? (
                  <BedDouble size={14} />
                ) : experience.kind === "restaurant" ? (
                  <Utensils size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                <div>
                  <strong>{experience.name}</strong>
                  <small>
                    {option.name} ·{" "}
                    {experience.kind === "hotel"
                      ? `${rooms} 间 × ${nights} 晚`
                      : experience.kind === "restaurant"
                        ? `第 ${(selection.dayIndex ?? 0) + 1} 天${mealLabel(selection.mealType || experience.mealType)}`
                        : selection.dayIndex !== undefined
                          ? `第 ${selection.dayIndex + 1} 天`
                          : "顺路安排"}
                  </small>
                </div>
                <button
                  aria-label={`移除${experience.name}`}
                  onClick={() => removeExperience(experience.id)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="ch-basket-total">
            <span>
              所选项目参考小计 <small>{currency}</small>
            </span>
            <strong>
              {subtotal.incomplete
                ? "部分价格待核实"
                : rangeText(subtotal.low, subtotal.high, currency)}
            </strong>
            <p>
              按 {people} 人计算；酒店按 {rooms} 间 × {nights}{" "}
              晚。交通、剩余餐食及其他开销会在完整预算中另列。
              {passGroups.size > 0 &&
                " 通票按同日共用至分日使用的范围预留；生成后按实际游览日去重，增加天数会重新核算。"}
            </p>
          </div>
          <div className="ch-budget-note">
            <Info size={15} />
            <p>
              选定酒店替换本城市住宿预算；选定餐厅替换对应餐次。生成后统一核算，避免重复计算。
            </p>
          </div>
          <button
            className="primary-button ch-generate"
            disabled={generating || !!dayError}
            onClick={generate}
          >
            {generating
              ? "正在安排行程…"
              : stopIndex >= 0
                ? "用这些选择更新行程"
                : "生成我的城市行程"}
            <ArrowRight size={16} />
          </button>
          <p className="ch-basket-footnote">
            为容纳明确选择，生成时可能延长停留，最多额外 14
            天；仍放不下的项目保留为候选或待安排，可继续调整。
          </p>
        </aside>
      </div>
      <button
        className="ch-mobile-basket"
        onClick={() =>
          basketRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
        aria-label="查看选择并生成行程"
      >
        <span>
          <Check size={14} />
          已选 {totalSelected} 项 · {draft.days} 天
        </span>
        <strong>
          查看选择篮
          <ArrowRight size={14} />
        </strong>
      </button>
      {detail && (
        <Modal title={detail.item.name} onClose={() => setDetail(null)} wide>
          <ItemDetails
            detail={detail}
            city={city}
            currency={currency}
            rates={rates}
            selected={
              detail.kind === "sight"
                ? selectedIds.has(detail.item.id)
                : resolved.some(
                    ({ experience }) => experience.id === detail.item.id,
                  )
            }
            onToggleSight={() => toggleSight(detail.item.id)}
            onClose={() => setDetail(null)}
          />
        </Modal>
      )}
    </main>
  );
}

function GlobeIcon() {
  return <Compass size={15} />;
}
function SightCard({
  item,
  city,
  selected,
  currency,
  rates,
  onToggle,
  onDetails,
}) {
  const minutes = getVisitDurationRange(item);
  return (
    <article
      className={`ch-card ch-sight-card ${selected ? "is-selected" : ""}`}
    >
      <div className="ch-photo-button">
        <PlaceImage item={item} city={city} sight />
        <button
          className="ch-photo-hit"
          onClick={onDetails}
          aria-label={`查看${item.name}详情`}
        />
      </div>
      <div className="ch-card-content">
        <div className="ch-card-heading">
          <h3>
            <button onClick={onDetails}>{item.name}</button>
          </h3>
          <button
            className={`ch-select-circle ${selected ? "is-selected" : ""}`}
            aria-label={`${selected ? "移除" : "选择"}${item.name}`}
            aria-pressed={selected}
            onClick={onToggle}
          >
            {selected ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>
        <p className="ch-card-description">{item.description}</p>
        <div className="ch-visit-duration">
          <Clock3 size={13} />
          <span>约 {duration(minutes.recommended)}</span>
        </div>
        <div className="ch-card-price">
          <Price price={item.price} currency={currency} rates={rates} compact />
        </div>
        <details className="ch-card-details">
          <summary>
            详情
            <ChevronDown size={14} />
          </summary>
          <div className="ch-card-details-body">
            <p>{item.description}</p>
            <div className="ch-feature-tags">
              {item.category && <span>{item.category}</span>}
              {isLocalExploration(item) && <span>自由探索 · 非商家套餐</span>}
              {item.visitRole && (
                <span className="ch-visit-role">
                  {item.visitRole === "optional"
                    ? "按兴趣选择"
                    : item.visitRole === "neighborhood"
                      ? "街区与小停留"
                      : "初次到访推荐"}
                </span>
              )}
              {asArray(item.features).map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>
            <p>
              走马观花约 {duration(minutes.min)}，细致游览约{" "}
              {duration(minutes.max)}。生成后可调整。
            </p>
            {item.bestTime && <p>推荐时段：{item.bestTime}</p>}
            {item.accessNote && (
              <p className="ch-access-note">
                <Info size={13} />
                {item.accessNote}
              </p>
            )}
            {item.price?.note && <p>{item.price.note}</p>}
            <PriceSource
              price={item.price}
              sourceUrl={item.sourceUrl}
              sourceLabel="地点与入场资料"
            />
            <PlaceSourceDetails item={item} />
            <PlaceMediaDetails item={item} city={city} sight />
            <button className="text-button" onClick={onDetails}>
              完整资料
              <ArrowRight size={13} />
            </button>
          </div>
        </details>
      </div>
    </article>
  );
}
function ExperienceCard({
  item,
  city,
  selection,
  days,
  nights,
  currency,
  rates,
  people,
  onSelect,
  onRemove,
  onDetails,
}) {
  const [optionId, setOptionId] = useState(
    selection?.optionId || item.priceOptions?.[0]?.id,
  );
  const [day, setDay] = useState(
    selection?.dayIndex ?? (item.kind === "restaurant" ? 0 : "auto"),
  );
  const [meal, setMeal] = useState(
    selection?.mealType || item.mealType || "dinner",
  );
  useEffect(() => {
    if (selection) {
      setOptionId(selection.optionId);
      setDay(selection.dayIndex ?? (item.kind === "restaurant" ? 0 : "auto"));
      setMeal(selection.mealType || item.mealType || "dinner");
    }
  }, [selection?.optionId, selection?.dayIndex, selection?.mealType]);
  useEffect(() => {
    if (day !== "auto" && day >= days) setDay(days - 1);
  }, [days]);
  const option =
    item.priceOptions?.find((price) => price.id === optionId) ||
    item.priceOptions?.[0];
  const allowedMeals = asArray(option?.mealTypes).length
    ? option.mealTypes
    : asArray(item.mealTypes).length
      ? item.mealTypes
      : ["breakfast", "lunch", "dinner"];
  useEffect(() => {
    if (item.kind === "restaurant" && !allowedMeals.includes(meal))
      setMeal(allowedMeals[0]);
  }, [option?.id, allowedMeals.join(","), meal]);
  const minPeople = option?.minParticipants ?? item.minParticipants ?? 1;
  const maxPeople = option?.maxParticipants ?? item.maxParticipants ?? Infinity;
  const partyMismatch = people < minPeople || people > maxPeople;
  const partyRequirement =
    minPeople === maxPeople
      ? `此方案按 ${minPeople} 人同行提供`
      : maxPeople === Infinity
        ? `此方案至少需要 ${minPeople} 人同行`
        : `此方案适用于 ${minPeople}–${maxPeople} 人同行`;
  const same =
    selection &&
    selection.optionId === option?.id &&
    (item.kind === "hotel" ||
      (selection.dayIndex ?? (item.kind === "restaurant" ? 0 : "auto")) ===
        day) &&
    (item.kind !== "restaurant" ||
      (selection.mealType || item.mealType || "dinner") === meal);
  const cityBudget =
    item.priceBasis === "city-daily-lodging" ||
    option?.priceBasis === "city-daily-lodging";
  const visitMinutes =
    option?.totalDurationMinutes ||
    option?.durationMinutes ||
    item.totalDurationMinutes ||
    item.durationMinutes;
  const scheduleLabel =
    item.kind === "hotel"
      ? `${nights} 晚`
      : day === "auto"
        ? "按路线安排"
        : `第 ${Number(day) + 1} 天${item.kind === "restaurant" ? mealLabel(meal) : ""}`;
  const selectionDisabled =
    !option ||
    (!same && (partyMismatch || (item.kind === "hotel" && nights === 0)));
  function applySelection() {
    if (selectionDisabled) return;
    if (same) onRemove();
    else {
      onSelect(
        option.id,
        day === "auto" || item.kind === "hotel" ? undefined : day,
        meal,
      );
    }
  }
  function renderSelectionButton() {
    return (
      <button
        type="button"
        className={same ? "secondary-button" : "primary-button"}
        disabled={selectionDisabled}
        onClick={applySelection}
      >
        {same ? <Check size={14} /> : <Plus size={14} />}
        {same
          ? "已选 · 移除"
          : selection
            ? "更新选择"
            : item.kind === "hotel"
              ? "选择住宿"
              : item.kind === "restaurant"
                ? "安排这顿饭"
                : "加入行程"}
      </button>
    );
  }
  return (
    <article
      className={`ch-card ch-service-card ${selection ? "is-selected" : ""}`}
    >
      <div className="ch-service-photo">
        <PlaceImage item={item} city={city} />
        <button
          className="ch-photo-hit"
          onClick={() => onDetails(option?.id)}
          aria-label={`查看${item.name}详情`}
        />
      </div>
      <div className="ch-card-content">
        <div className="ch-card-heading">
          <h3>
            <button onClick={() => onDetails(option?.id)}>{item.name}</button>
          </h3>
        </div>
        <p className="ch-card-description">
          {item.tagline || item.description}
        </p>
        <div className="ch-visit-duration">
          <Clock3 size={13} />
          <span>
            {item.kind === "hotel"
              ? `本城 ${nights} 晚`
              : visitMinutes
                ? `约 ${duration(visitMinutes)}`
                : "用时以所选服务为准"}
          </span>
        </div>
        {option && (
          <>
            <div className="ch-card-price">
              <Price
                price={option}
                currency={currency}
                rates={rates}
                unit={priceUnit(option)}
                compact
              />
            </div>
            {cityBudget && (
              <span className="ch-budget-basis">城市预算参考</span>
            )}
            <p className="ch-selected-option">
              {option.name} · {scheduleLabel}
            </p>
          </>
        )}
        {partyMismatch && (
          <p className="ch-access-note">
            {partyRequirement}；当前 {people} 人。
          </p>
        )}
        {item.kind === "hotel" && nights === 0 && (
          <p className="ch-availability-note">本城未安排过夜，暂无住宿晚数。</p>
        )}
        <div className="ch-service-actions">{renderSelectionButton()}</div>
        <details className="ch-card-details">
          <summary>
            {item.kind === "hotel" ? "住宿详情" : "方案与详情"}
            <ChevronDown size={14} />
          </summary>
          <div className="ch-card-details-body">
            <span className="ch-service-provider">
              {KIND_LABEL[item.kind]}
              {item.provider || item.nameEn
                ? ` · ${item.provider || item.nameEn}`
                : ""}
            </span>
            <p>{item.description}</p>
            <div className="ch-feature-tags">
              {asArray(item.features).map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>
            {item.address && (
              <p className="ch-address">
                <MapPin size={13} />
                {item.address}
              </p>
            )}
            <label className="ch-option-label">
              <span>
                {cityBudget
                  ? "住宿预算参考"
                  : item.kind === "hotel"
                    ? "房型与服务"
                    : "套餐与服务"}
              </span>
              <select
                aria-label={`${item.name}${cityBudget ? "住宿预算参考" : "套餐"}`}
                value={option?.id || ""}
                onChange={(e) => setOptionId(e.target.value)}
              >
                {asArray(item.priceOptions).map((price) => (
                  <option key={price.id} value={price.id}>
                    {price.name}
                  </option>
                ))}
              </select>
            </label>
            {cityBudget && (
              <p>
                按该城市日常住宿费用预留，尚非这家住宿的房型报价；房态、服务与实际价格请向住宿方确认。
              </p>
            )}
            {option && (
              <>
                <p className="ch-option-description">{option.description}</p>
                <div className="ch-inclusions">
                  <div>
                    <Check size={13} />
                    <p>
                      {asArray(option.includes).length
                        ? option.includes.join(" · ")
                        : "包含内容请查服务详情"}
                    </p>
                  </div>
                  {asArray(option.excludes).length > 0 && (
                    <div className="is-excluded">
                      <X size={13} />
                      <p>另计：{option.excludes.join(" · ")}</p>
                    </div>
                  )}
                </div>
                {option.note && <p>{option.note}</p>}
                <PriceSource
                  price={option}
                  sourceUrl={item.sourceUrl}
                  sourceLabel={
                    item.sourceProvider === "openstreetmap"
                      ? "地图地点资料"
                      : undefined
                  }
                />
              </>
            )}
            {item.kind !== "hotel" && (
              <div className="ch-service-schedule">
                <label>
                  <span>安排在哪天</span>
                  <select
                    value={day}
                    onChange={(e) =>
                      setDay(
                        e.target.value === "auto"
                          ? "auto"
                          : Number(e.target.value),
                      )
                    }
                    aria-label={`${item.name}安排日期`}
                  >
                    {item.kind !== "restaurant" && (
                      <option value="auto">按路线安排</option>
                    )}
                    {Array.from({ length: days }, (_, index) => (
                      <option key={index} value={index}>
                        第 {index + 1} 天
                      </option>
                    ))}
                  </select>
                </label>
                {item.kind === "restaurant" && (
                  <label>
                    <span>用餐时段</span>
                    <select
                      value={meal}
                      onChange={(e) => setMeal(e.target.value)}
                      aria-label={`${item.name}用餐时段`}
                    >
                      {allowedMeals.map((value) => (
                        <option key={value} value={value}>
                          {mealLabel(value)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
            <div className="ch-service-actions">{renderSelectionButton()}</div>
            {!same && (
              <p className="ch-detail-note">点击上方按钮确认方案，选择篮才会更新。</p>
            )}
            {item.kind === "hotel" && (
              <p className="ch-hotel-note">
                本城市共 {nights} 晚；选择后替换原住宿预算。
              </p>
            )}
            {item.bestTime && <p>推荐时段：{item.bestTime}</p>}
            {item.availabilityNote && (
              <p className="ch-availability-note">{item.availabilityNote}</p>
            )}
            {(minPeople > 1 || maxPeople !== Infinity) && !partyMismatch && (
              <p>{partyRequirement}。</p>
            )}
            <PlaceSourceDetails item={item} />
            <PlaceMediaDetails item={item} city={city} />
            <button
              className="text-button"
              onClick={() => onDetails(option?.id)}
            >
              完整资料
              <ArrowRight size={13} />
            </button>
            {safeUrl(item.bookingUrl) && (
              <OutLink href={item.bookingUrl}>
                {item.sourceProvider === "openstreetmap"
                  ? "查看所列住宿网站"
                  : "前往官方或商家预订页"}
              </OutLink>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}

function ItemDetails({
  detail,
  city,
  currency,
  rates,
  selected,
  onToggleSight,
  onClose,
}) {
  const item = detail.item;
  const sight = detail.kind === "sight";
  const source = safeUrl(item.sourceUrl || item.price?.sourceUrl);
  const options = asArray(item.priceOptions);
  return (
    <div className="ch-details">
      <PlaceImage item={item} city={city} sight className="ch-detail-image" />
      <PlaceMediaDetails item={item} city={city} sight={sight} />
      <span className="eyebrow">{item.nameEn}</span>
      <p className="ch-detail-description">{item.description}</p>
      <div className="ch-feature-tags">
        {asArray(item.features).map((feature) => (
          <span key={feature}>{feature}</span>
        ))}
      </div>
      {item.address && (
        <p className="ch-address">
          <MapPin size={15} />
          {item.address}
        </p>
      )}
      {item.accessNote && (
        <p className="ch-access-note">
          <Info size={15} />
          {item.accessNote}
        </p>
      )}
      {item.bestTime && (
        <p className="ch-detail-note">推荐时段：{item.bestTime}</p>
      )}
      {item.priceBasis === "city-daily-lodging" && (
        <p className="ch-detail-note">
          城市住宿预算参考，非本店房型报价；营业状态、房态与实际服务尚未独立核实。
        </p>
      )}
      {sight ? (
        <>
          <div className="ch-detail-duration">
            <Clock3 size={17} />
            <p>
              建议停留 {duration(getVisitDurationRange(item).recommended)}
              <small>
                走马观花约 {duration(getVisitDurationRange(item).min)}
                ，细致游览约 {duration(getVisitDurationRange(item).max)}
                。生成后可自行调整。
              </small>
            </p>
          </div>
          <Price price={item.price} currency={currency} rates={rates} />
          <p className="ch-detail-note">{item.price?.note}</p>
          <PriceSource
            price={item.price}
            sourceUrl={item.sourceUrl}
            sourceLabel="地点与入场资料"
          />
          <button className="primary-button" onClick={onToggleSight}>
            {selected ? <Check size={15} /> : <Plus size={15} />}
            {selected ? "已选择 · 点击移除" : "加入想去的地方"}
          </button>
        </>
      ) : (
        <>
          <div className="ch-detail-options">
            {options.map((option) => (
              <section
                key={option.id}
                className={option.id === detail.optionId ? "is-current" : ""}
              >
                <div>
                  <h3>{option.name}</h3>
                  <Price
                    price={option}
                    currency={currency}
                    rates={rates}
                    unit={priceUnit(option)}
                  />
                </div>
                <p>{option.description}</p>
                <div className="ch-detail-inclusions">
                  <div>
                    <h4>
                      <Check size={14} />
                      包含
                    </h4>
                    <ul>
                      {asArray(option.includes).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>
                      <X size={14} />
                      不包含 / 另计
                    </h4>
                    <ul>
                      {asArray(option.excludes).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {option.note && <p className="ch-detail-note">{option.note}</p>}
                {option.priceBasis === "city-daily-lodging" && (
                  <p className="ch-detail-note">
                    城市预算参考，非本店实际报价。
                  </p>
                )}
                <PriceSource
                  price={option}
                  sourceUrl={item.sourceUrl}
                  sourceLabel={
                    item.sourceProvider === "openstreetmap"
                      ? "地图地点资料"
                      : undefined
                  }
                />
              </section>
            ))}
          </div>
          {asArray(item.requirements).length > 0 && (
            <section className="ch-requirements">
              <h3>出发前知道这些</h3>
              <ul>
                {item.requirements.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          )}
          {typeof item.requirements === "string" && (
            <p className="ch-detail-note">{item.requirements}</p>
          )}
          {item.availabilityNote && (
            <p className="ch-access-note">
              <Info size={15} />
              {item.availabilityNote}
            </p>
          )}
          <div className="ch-service-verification">
            {item.sourceProvider !== "openstreetmap" &&
              dateLabel(item.checkedAt) && (
                <span>
                  商家与服务资料核验于 {dateLabel(item.checkedAt)} ·
                  套餐价格是否核验以各套餐标注为准
                </span>
              )}
          </div>
        </>
      )}
      <PlaceSourceDetails item={item} />
      <div className="ch-detail-footer">
        {source && <OutLink href={source}>查看原始资料</OutLink>}
        {safeUrl(item.bookingUrl) && (
          <OutLink href={item.bookingUrl}>
            {item.sourceProvider === "openstreetmap"
              ? "查看所列住宿网站"
              : "查询实际日期与预订"}
          </OutLink>
        )}
        {Number.isFinite(item.lat) && Number.isFinite(item.lng) && (
          <OutLink
            href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`}
          >
            在地图中查看
          </OutLink>
        )}
        {!sight && (
          <button className="secondary-button" onClick={onClose}>
            返回选择套餐
          </button>
        )}
      </div>
    </div>
  );
}
