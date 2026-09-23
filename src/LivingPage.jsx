import EditableNumberInput from "./EditableNumberInput.jsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Coffee,
  Home,
  Landmark,
  MapPin,
  Plus,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { CityPicker, OutLink, Photo, money } from "./ui.jsx";
import {
  LIVING_MONTHS,
  LIVING_STORAGE_KEY,
  LIVING_TIERS,
  calculateLivingBudget,
  normalizeLivingPreferences,
  rentalSearchLink,
  restoreLivingState,
} from "../shared/living.mjs";
import "./living.css";

const groups = {
  housing: "住房",
  food: "餐饮",
  transport: "交通",
  daily: "日用",
  extra: "其他",
  reserve: "机动",
};
const groupColors = {
  housing: "#42604b",
  food: "#a1b080",
  transport: "#d4b784",
  daily: "#c68e6a",
  extra: "#8ea7ad",
  reserve: "#e0e6d5",
};

function NumberField({
  label,
  value,
  onChange,
  unit,
  note,
  min = 0,
  max = 1e9,
  step = "any",
}) {
  return (
    <label className="living-number-field">
      <span>{label}</span>
      <span className="living-input-wrap">
        <EditableNumberInput
          aria-label={label}
          type="number"
          inputMode={step === 1 ? "numeric" : "decimal"}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) =>
            onChange(event.target.value === "" ? 0 : Number(event.target.value))
          }
        />
        <small>{unit}</small>
      </span>
      {note && <small className="living-field-note">{note}</small>}
    </label>
  );
}

export default function LivingPage({
  cities,
  rates,
  currency,
  onOpenCity,
  onToast,
}) {
  const [state, setState] = useState(() => {
    try {
      return restoreLivingState(
        localStorage.getItem(LIVING_STORAGE_KEY),
        cities,
      );
    } catch {
      return restoreLivingState(null, cities);
    }
  });
  const [picker, setPicker] = useState(null);
  const [editor, setEditor] = useState("home");
  const [storageSaved, setStorageSaved] = useState(false);
  const [ledgerRequest, setLedgerRequest] = useState(0);
  const ledgerTitleRef = useRef(null);
  const storageErrorReported = useRef(false);
  const city = cities.find((item) => item.id === state.cityId) || cities[0];
  const preferences = normalizeLivingPreferences(state.byCity[city?.id]);
  const budget = useMemo(() => {
    try {
      return calculateLivingBudget(city, preferences, currency, rates);
    } catch {
      return null;
    }
  }, [city, state.byCity, currency, rates]);

  useEffect(() => {
    try {
      localStorage.setItem(LIVING_STORAGE_KEY, JSON.stringify(state));
      setStorageSaved(true);
      storageErrorReported.current = false;
    } catch {
      setStorageSaved(false);
      if (!storageErrorReported.current) {
        onToast?.(
          "浏览器未能保存旅居偏好，请检查存储权限或可用空间；本页仍可继续计算",
        );
        storageErrorReported.current = true;
      }
    }
  }, [state]);

  useEffect(() => {
    if (!ledgerRequest || !ledgerTitleRef.current) return;
    // Wait for the selected city's amounts to render, then reveal the ledger.
    // A separate request also handles opening the already-selected city again.
    ledgerTitleRef.current.focus({ preventScroll: true });
    ledgerTitleRef.current.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }, [ledgerRequest]);

  const openLedger = (cityId) => {
    setState((previous) => ({ ...previous, cityId }));
    setLedgerRequest((previous) => previous + 1);
  };
  const change = (patch) =>
    setState((previous) => ({
      ...previous,
      byCity: {
        ...previous.byCity,
        [city.id]: normalizeLivingPreferences({
          ...normalizeLivingPreferences(previous.byCity[city.id]),
          ...patch,
        }),
      },
    }));
  const changeAmount = (key, amount) =>
    change({ amounts: { ...preferences.amounts, [key]: amount } });
  const chooseCity = (id) => {
    setState((previous) =>
      picker === "compare"
        ? {
            ...previous,
            compareIds: [...new Set([...previous.compareIds, id])].slice(0, 3),
          }
        : { ...previous, cityId: id },
    );
    setPicker(null);
  };
  const reset = () => {
    change({ amounts: normalizeLivingPreferences().amounts });
    onToast?.("已恢复这座城市的费用基准；人数、周期和生活习惯保留");
  };

  if (!city || !budget)
    return (
      <main className="living-page">
        <div className="living-empty">
          <Home />
          <h1>旅居生活</h1>
          <p>这座城市的生活成本或汇率数据暂不可用，请稍后重试。</p>
        </div>
      </main>
    );

  const format = (value) => money(value, currency);
  const nativeUnit = city.currency;
  const comparisons = state.compareIds
    .map((id) => cities.find((candidate) => candidate.id === id))
    .filter(Boolean)
    .map((candidate) => {
      try {
        return {
          city: candidate,
          budget: calculateLivingBudget(
            candidate,
            { ...preferences, amounts: {}, monthlyBudget: 0 },
            currency,
            rates,
          ),
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  const maxComparison = Math.max(
    ...comparisons.map((item) => item.budget.monthly),
    1,
  );
  const groupAmounts = Object.keys(groups).map((key) => ({
    key,
    amount: budget.rows
      .filter((row) => row.group === key)
      .reduce((sum, row) => sum + row.amount, 0),
  }));
  const hasExtras = [
    "internet",
    "insurance",
    "coworking",
    "entertainment",
  ].some((key) => preferences.amounts[key] > 0);
  const budgetRemaining = budget.monthlyBudget - budget.monthly;

  return (
    <main className="living-page" data-testid="living-page">
      <header className="living-heading">
        <div>
          <p className="living-eyebrow">A PLACE TO CALL HOME</p>
          <h1>换一座城市，好好生活。</h1>
          <p>从一份月度账本，想象日常的另一种可能。</p>
        </div>
        <span
          className={`living-saved${storageSaved ? "" : " living-not-saved"}`}
          role="status"
        >
          {storageSaved ? <Check size={14} /> : <Wallet size={14} />}
          {storageSaved ? "偏好自动保存在本机" : "偏好尚未保存 · 仅本次使用"}
        </span>
      </header>

      <section className="living-hero" aria-label="旅居城市与居住偏好">
        <div className="living-city-scene">
          <Photo image={city.image} alt={`${city.name}城市实景`} />
          <div className="living-city-top">
            <span>
              <MapPin size={14} />
              {city.country} · {city.region}
            </span>
            <button onClick={() => setPicker("city")}>
              更换城市
              <ChevronDown size={15} />
            </button>
          </div>
          <div className="living-city-copy">
            <span>在这里，住一阵子</span>
            <h2>
              {city.name}
              <small>{city.nameEn}</small>
            </h2>
            <p>{city.tagline}</p>
            <button onClick={() => onOpenCity?.(city.id)}>
              认识这座城市
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="living-household">
          <div className="living-section-heading">
            <span className="living-kicker">
              <Home size={16} />
              我的生活方式
            </span>
            <span className="living-native-currency">
              费用基准 · {nativeUnit}
            </span>
          </div>
          <h3>给生活留一点时间</h3>
          <div className="living-periods" aria-label="居住周期">
            {LIVING_MONTHS.map((months) => (
              <button
                key={months}
                aria-pressed={preferences.months === months}
                className={preferences.months === months ? "selected" : ""}
                onClick={() => change({ months })}
              >
                {months}个月
              </button>
            ))}
          </div>
          <div className="living-household-counts">
            <NumberField
              label="居住人数"
              value={preferences.people}
              onChange={(people) => change({ people })}
              unit="人"
              min={1}
              max={20}
              step={1}
            />
            <NumberField
              label="租住房间"
              value={preferences.rooms}
              onChange={(rooms) => change({ rooms })}
              unit="间"
              min={1}
              max={preferences.people}
              step={1}
            />
          </div>
          <label className="living-tier-label">
            生活档位
            <select
              aria-label="生活档位"
              value={preferences.tier}
              onChange={(event) => change({ tier: Number(event.target.value) })}
            >
              {LIVING_TIERS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="living-household-note">
            租金、水电按房间；餐饮与出行按人数。每个预算月按 30
            天计算。切换档位保留手动金额，可用“恢复城市费用基准”重新套用。
          </p>
        </div>
      </section>

      <div className="living-workspace">
        <div className="living-main-column">
          <section
            id="living-monthly-ledger"
            className="living-monthly-card"
            aria-labelledby="living-monthly-title"
          >
            <div className="living-section-heading">
              <div>
                <p className="living-eyebrow">YOUR MONTHLY LIFE</p>
                <h2
                  id="living-monthly-title"
                  ref={ledgerTitleRef}
                  tabIndex={-1}
                >
                  {city.name} · 每月生活账本
                </h2>
              </div>
              <span className="living-estimate-badge">规划估算</span>
            </div>
            <div className="living-monthly-number">
              <strong data-testid="living-monthly" data-amount={budget.monthly}>
                {format(budget.monthly)}
              </strong>
              <span>/ 月 · {preferences.people} 人合计</span>
            </div>
            <div className="living-monthly-context">
              <span>约 {format(budget.perPerson)} / 人月</span>
              <span>包含 {preferences.reservePercent}% 机动金</span>
            </div>
            <div
              className="living-cost-distribution"
              role="img"
              aria-label={groupAmounts
                .filter((item) => item.amount > 0)
                .map(
                  (item) =>
                    `${groups[item.key]} ${Math.round((item.amount / budget.monthly) * 100)}%`,
                )
                .join("，")}
            >
              {groupAmounts
                .filter((item) => item.amount > 0)
                .map((item) => (
                  <span
                    key={item.key}
                    title={`${groups[item.key]} ${format(item.amount)}`}
                    style={{
                      width: `${budget.monthly > 0 ? (item.amount / budget.monthly) * 100 : 0}%`,
                      backgroundColor: groupColors[item.key],
                    }}
                  />
                ))}
            </div>
            <div className="living-distribution-key">
              {groupAmounts
                .filter((item) => item.amount > 0)
                .map((item) => (
                  <span key={item.key}>
                    <i style={{ background: groupColors[item.key] }} />
                    {groups[item.key]}
                    <b>
                      {budget.monthly > 0
                        ? Math.round((item.amount / budget.monthly) * 100)
                        : 0}
                      %
                    </b>
                  </span>
                ))}
            </div>
            <div className="living-budget-rows">
              {budget.rows.map((row) => (
                <div
                  key={row.id}
                  className={`living-budget-row ${row.amount === 0 ? "unbudgeted" : ""}`}
                >
                  <span>
                    <i style={{ background: groupColors[row.group] }} />
                    <span>
                      {row.label}
                      <small>
                        {row.id === "food"
                          ? `${preferences.cookingPercent}% 自炊 · ${preferences.people} 人`
                          : row.id === "reserve"
                            ? `${preferences.reservePercent}% × 每月基础支出`
                            : `${row.quantity} ${row.unit}`}
                      </small>
                    </span>
                  </span>
                  <strong>
                    {row.amount === 0 && row.group === "extra"
                      ? "未计入"
                      : format(row.amount)}
                  </strong>
                </div>
              ))}
            </div>
            <p className="living-inline-note">
              {hasExtras
                ? "补充项目按你填写的金额计入。"
                : "网络、医疗保险、办公和娱乐尚未单独计入，可在右侧补充。"}{" "}
              若租金或水电套餐已含网络，请勿重复填写。
            </p>
          </section>

          <section
            className="living-cash-card"
            aria-labelledby="living-period-title"
          >
            <div className="living-section-heading">
              <div>
                <p className="living-eyebrow">SETTLE IN, STAY A WHILE</p>
                <h2 id="living-period-title">
                  住 {preferences.months} 个月的账本
                </h2>
              </div>
              <Wallet size={22} />
            </div>
            <div className="living-period-total">
              <span>期间预计消费</span>
              <strong data-testid="living-period" data-amount={budget.period}>
                {format(budget.period)}
              </strong>
            </div>
            <p className="living-total-formula">
              {format(budget.monthly)} × {preferences.months} 个月 +{" "}
              {format(budget.setup)} 安置费
            </p>
            <div className="living-cash-details">
              <div>
                <span>可退押金 · 资金暂时占用</span>
                <strong
                  data-testid="living-deposit"
                  data-amount={budget.deposit}
                >
                  {format(budget.deposit)}
                </strong>
                <small>
                  {preferences.depositMonths} 个月房租，单列于消费之外
                </small>
              </div>
              <div>
                <span>首月需准备</span>
                <strong
                  data-testid="living-first-cash"
                  data-amount={budget.firstMonthCash}
                >
                  {format(budget.firstMonthCash)}
                </strong>
                <small>首月生活 + 安置费 + 押金</small>
              </div>
            </div>
            <div className="living-period-cash">
              <span>
                全期资金准备 <small>期间消费 + 可退押金</small>
              </span>
              <strong
                data-testid="living-period-cash"
                data-amount={budget.periodCash}
              >
                {format(budget.periodCash)}
              </strong>
            </div>
            <p className="living-inline-note">
              押金以最终租约的退还条件为准。跨城机票、签证税费及未填写的项目尚未计入；当地若预收多月租金，首月资金需求也会变化。
            </p>
          </section>
        </div>

        <aside
          className="living-preferences"
          aria-labelledby="living-preferences-title"
        >
          <div className="living-section-heading">
            <div>
              <span className="living-kicker">
                <SlidersHorizontal size={15} />
                按自己的日常来
              </span>
              <h2 id="living-preferences-title">调整生活偏好</h2>
            </div>
            <button
              className="living-reset"
              onClick={reset}
              aria-label="恢复城市费用基准"
              title="恢复城市费用基准"
            >
              <RotateCcw size={17} />
            </button>
          </div>
          <p className="living-preference-intro">
            以下金额以 {nativeUnit}{" "}
            填写。切换顶部币种只改变显示换算，保留你填写的原币金额。
          </p>
          <div
            className="living-editor-tabs"
            role="group"
            aria-label="生活偏好分类"
          >
            {[
              ["home", "住房"],
              ["food", "餐饮"],
              ["extras", "其他"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={editor === key ? "active" : ""}
                aria-pressed={editor === key}
                onClick={() => setEditor(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="living-editor-panel">
            {editor === "home" && (
              <>
                <NumberField
                  label="月租（每间 / 月）"
                  value={budget.unitAmounts.rent}
                  onChange={(value) => changeAmount("rent", value)}
                  unit={nativeUnit}
                  note={`城市基准：${money(city.monthly.rent[0], nativeUnit)}–${money(city.monthly.rent[2], nativeUnit)}，随地段与房型变化。`}
                />
                <NumberField
                  label="水电（每间 / 月）"
                  value={budget.unitAmounts.utilities}
                  onChange={(value) => changeAmount("utilities", value)}
                  unit={nativeUnit}
                />
                <NumberField
                  label="押金月数"
                  value={preferences.depositMonths}
                  onChange={(depositMonths) => change({ depositMonths })}
                  unit="个月租金"
                  max={12}
                  step={0.5}
                  note="默认 1 个月仅为规划假设，请按租约修改。"
                />
                <NumberField
                  label="搬家与安置费（一次性）"
                  value={budget.unitAmounts.setup}
                  onChange={(value) => changeAmount("setup", value)}
                  unit={nativeUnit}
                  note="全体合计；搬家、用品购置等，默认尚未计入。"
                />
                <OutLink
                  href={rentalSearchLink(city)}
                  className="living-rental-link"
                >
                  查询{city.name}长期租房
                </OutLink>
              </>
            )}
            {editor === "food" && (
              <>
                <NumberField
                  label="全日外食预算（每人 / 天）"
                  value={budget.unitAmounts.eatingOutDaily}
                  onChange={(value) => changeAmount("eatingOutDaily", value)}
                  unit={nativeUnit}
                />
                <label className="living-range-label">
                  <span>
                    在家做饭的比例<strong>{preferences.cookingPercent}%</strong>
                  </span>
                  <input
                    aria-label="自炊比例"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={preferences.cookingPercent}
                    onChange={(event) =>
                      change({ cookingPercent: Number(event.target.value) })
                    }
                  />
                  <span className="living-range-ends">
                    <small>常常外食</small>
                    <small>以自炊为主</small>
                  </span>
                </label>
                <NumberField
                  label="自炊花费相当于外食"
                  value={Math.round(preferences.cookingRatio * 100)}
                  onChange={(value) => change({ cookingRatio: value / 100 })}
                  unit="%"
                  min={10}
                  max={100}
                  step={1}
                  note="默认 45% 是计算假设，并非当地菜价调查；可以根据买菜习惯调整。"
                />
                <div className="living-food-result">
                  <Coffee size={20} />
                  <div>
                    <span>全体月度餐饮估算</span>
                    <strong>
                      {format(
                        budget.rows.find((row) => row.id === "food").amount,
                      )}
                    </strong>
                  </div>
                </div>
                <p className="living-inline-note">
                  外食日预算 × 30 天 ×
                  人数，再按自炊比例加权。餐饮数值不含单独的宴请或特色体验。
                </p>
              </>
            )}
            {editor === "extras" && (
              <>
                <NumberField
                  label="交通（每人 / 月）"
                  value={budget.unitAmounts.transport}
                  onChange={(value) => changeAmount("transport", value)}
                  unit={nativeUnit}
                  note="初始按城市日预算 × 30 天，可改成实际月票或通勤费。"
                />
                <NumberField
                  label="日用品（每人 / 月）"
                  value={budget.unitAmounts.misc}
                  onChange={(value) => changeAmount("misc", value)}
                  unit={nativeUnit}
                />
                <NumberField
                  label="额外网络（全体 / 月）"
                  value={budget.unitAmounts.internet}
                  onChange={(value) => changeAmount("internet", value)}
                  unit={nativeUnit}
                />
                <NumberField
                  label="医疗保险（每人 / 月）"
                  value={budget.unitAmounts.insurance}
                  onChange={(value) => changeAmount("insurance", value)}
                  unit={nativeUnit}
                />
                <NumberField
                  label="办公空间（每人 / 月）"
                  value={budget.unitAmounts.coworking}
                  onChange={(value) => changeAmount("coworking", value)}
                  unit={nativeUnit}
                />
                <NumberField
                  label="娱乐兴趣（每人 / 月）"
                  value={budget.unitAmounts.entertainment}
                  onChange={(value) => changeAmount("entertainment", value)}
                  unit={nativeUnit}
                />
                <NumberField
                  label="生活机动金比例"
                  value={preferences.reservePercent}
                  onChange={(reservePercent) => change({ reservePercent })}
                  unit="%"
                  max={100}
                />
              </>
            )}
          </div>
          <div className="living-affordability">
            <div className="living-kicker">
              <Landmark size={16} />
              看看预算是否宽裕
            </div>
            <NumberField
              label="每月可用生活预算"
              value={preferences.monthlyBudget}
              onChange={(monthlyBudget) => change({ monthlyBudget })}
              unit={nativeUnit}
              note="全体合计，填 0 暂不比较。"
            />
            {budget.budgetRatio !== null && (
              <>
                <div
                  className={`living-budget-meter ${budget.budgetRatio > 1 ? "over" : ""}`}
                  role="meter"
                  aria-label="月度预算使用比例"
                  aria-valuenow={Math.round(budget.budgetRatio * 100)}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(
                    100,
                    Math.ceil(budget.budgetRatio * 100),
                  )}
                >
                  <span
                    style={{
                      width: `${Math.min(100, budget.budgetRatio * 100)}%`,
                    }}
                  />
                </div>
                <p className={budgetRemaining < 0 ? "living-over-budget" : ""}>
                  {budgetRemaining >= 0
                    ? `每月还可留出 ${format(budgetRemaining)}`
                    : `超出月度预算 ${format(-budgetRemaining)}`}
                </p>
              </>
            )}
          </div>
        </aside>
      </div>

      <section
        className="living-comparison"
        aria-labelledby="living-compare-title"
      >
        <div className="living-section-heading">
          <div>
            <p className="living-eyebrow">SAME LIFE, DIFFERENT CITY</p>
            <h2 id="living-compare-title">如果换一座城市生活</h2>
          </div>
          <button
            className="living-add-city"
            disabled={state.compareIds.length >= 3}
            onClick={() => setPicker("compare")}
          >
            <Plus size={16} />
            添加对比城市 <small>{state.compareIds.length}/3</small>
          </button>
        </div>
        <p className="living-comparison-note">
          以相同的 {preferences.people} 人、{preferences.rooms} 间房、
          {LIVING_TIERS[preferences.tier]}
          及自炊比例对比城市基准，不含自定义金额或可选补充项。
        </p>
        {comparisons.length > 0 ? (
          <div className="living-comparison-grid">
            {comparisons.map((item) => (
              <article key={item.city.id} className="living-compare-city">
                <Photo image={item.city.image} alt={item.city.name} />
                <button
                  className="living-remove-compare"
                  aria-label={`移除${item.city.name}对比`}
                  onClick={() =>
                    setState((previous) => ({
                      ...previous,
                      compareIds: previous.compareIds.filter(
                        (id) => id !== item.city.id,
                      ),
                    }))
                  }
                >
                  <X size={15} />
                </button>
                <div>
                  <span>{item.city.country}</span>
                  <h3>{item.city.name}</h3>
                  <p>
                    <strong>{format(item.budget.monthly)}</strong> / 月
                  </p>
                  <div className="living-comparison-bar">
                    <span
                      style={{
                        width: `${(item.budget.monthly / maxComparison) * 100}%`,
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    aria-controls="living-monthly-ledger"
                    aria-label={`查看${item.city.name}生活账本`}
                    onClick={() => openLedger(item.city.id)}
                  >
                    查看生活账本
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="living-comparison-empty">
            <Sparkles size={23} />
            <p>
              海边、古城，还是熟悉的大都市？
              <small>选最多 3 座城市，看同样的生活预算能住在哪里。</small>
            </p>
            <button onClick={() => setPicker("compare")}>
              挑选城市
              <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </section>

      <footer className="living-method">
        <ShieldCheck size={20} />
        <div>
          <strong>让预算的依据也清清楚楚</strong>
          <p>
            本页是生活成本规划估算，城市基准更新于{" "}
            {city.budgetBasis?.updatedAt || "日期未提供"}
            ；月租与水电来自城市月度预算，餐饮、交通、日用品由每日预算按 30
            天折算。金额不是已核验的长租房源或实时市场报价，也不代表最低或最高价格。
          </p>
          <p>
            价格会随租期、地段、房型和季节变化。
            {rates?.asOf
              ? `汇率日期：${rates.asOf}。`
              : ""}自定义金额保存在 {nativeUnit}，所有汇总统一换算为 {currency}
            。
          </p>
        </div>
      </footer>
      {picker && (
        <CityPicker
          title={
            picker === "compare"
              ? "挑选想对比的生活城市"
              : "想在哪座城市住一阵子？"
          }
          cities={cities}
          onPick={chooseCity}
          onClose={() => setPicker(null)}
          exclude={picker === "compare" ? state.compareIds : []}
          currency={currency}
          rates={rates}
          origin
        />
      )}
    </main>
  );
}
