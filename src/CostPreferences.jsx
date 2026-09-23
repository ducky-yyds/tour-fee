import React, { useEffect, useState } from "react";
import {
  BedDouble,
  Utensils,
  Route,
  SlidersHorizontal,
  Check,
  RotateCcw,
} from "lucide-react";
import { money, convert } from "./ui.jsx";
import DestinationSelect from "./DestinationSelect.jsx";
import "./cost-preferences.css";

const FIELDS = [
  { key: "lodging", label: "住宿偏好", unit: "每间 / 每晚", icon: BedDouble },
  { key: "food", label: "饮食偏好", unit: "每人 / 每天", icon: Utensils },
  { key: "transport", label: "市内交通", unit: "每人 / 每天", icon: Route },
];
export default function CostPreferences({
  plan,
  budget,
  cities,
  rates,
  activeStop,
  onSelectStop,
  onApply,
  onOpenCity,
}) {
  const index = Math.min(activeStop, plan.stops.length - 1);
  const stop = plan.stops[index],
    city = cities.find((c) => c.id === stop.cityId);
  const selectedHotel = (stop.experienceSelections || [])
    .map((s) => city.experiences?.find((e) => e.id === s.experienceId))
    .find((e) => e?.kind === "hotel");
  const unknown = city.coverage === 'airport-only';
  const baseValues = (key) =>
    key === "lodging" && plan.mode === "stay"
      ? city.monthly.rent.map((n) => Math.round((n / 30) * 100) / 100)
      : city.daily[key];
  const [draft, setDraft] = useState({});
  useEffect(
    () =>
      setDraft(
        Object.fromEntries(
          FIELDS.map((f) => [f.key, stop.dailyPreferences?.[f.key] ?? ""]),
        ),
      ),
    [index, stop.dailyPreferences, city.id],
  );
  const hasChanges = FIELDS.some(
    (f) =>
      String(draft[f.key] ?? "") !==
      String(stop.dailyPreferences?.[f.key] ?? ""),
  );
  function apply(e) {
    e.preventDefault();
    const next = Object.fromEntries(
      FIELDS.filter(
        (f) => draft[f.key] !== "" && draft[f.key] !== undefined,
      ).map((f) => [f.key, Number(draft[f.key])]),
    );
    if (
      Object.values(next).some((n) => !Number.isFinite(n) || n < 0 || n > 1e7)
    )
      return;
    onApply(index, next);
  }
  return (
    <div className="cost-planning">
      <div className="cost-group-cards">
        {(budget?.costGroups || []).map((group) => (
          <div className={"cost-group-card " + group.id} key={group.id}>
            <span>{group.label}</span>
            <strong>{group.missingPrice && !group.amount ? '待补充' : money(group.amount, plan.currency)}{group.missingPrice && group.amount > 0 ? ' + 待补充' : ''}</strong>
            <small>
              {group.id === "daily"
                ? group.missingPrice ? '尚有日常费用待补充' : `${money(group.perDay, plan.currency)} / 全员每天 · 随天数变化`
                : group.id === "fixed"
                  ? "城际交通、门票、特色体验、接驳与签证"
                  : "单独预留，覆盖计划外的小额开销"}
            </small>
          </div>
        ))}
      </div>
      <form className="daily-preferences" onSubmit={apply}>
        <div className="daily-preference-heading">
          <div>
            <span className="eyebrow">MAKE IT YOUR EVERYDAY</span>
            <h3>
              <SlidersHorizontal size={18} />
              把日常，调成喜欢的样子
            </h3>
            <p>
              住宿、饮食和出行按你的偏好计算；门票等一次性费用随所选项目计入。
            </p>
          </div>
          <div className="preference-city-select">
            <span>调整城市</span>
            <DestinationSelect label="消费偏好城市" value={plan.stops[index]?.cityId}
              cities={plan.stops.map((s) => cities.find((c) => c.id === s.cityId)).filter(Boolean)}
              onChange={(id) => onSelectStop(plan.stops.findIndex((s) => s.cityId === id))} />
          </div>
        </div>
        <div className="preference-fields">
          {FIELDS.map((field) => {
            const Icon = field.icon,
              values = baseValues(field.key),
              amount =
                draft[field.key] === "" || draft[field.key] === undefined
                  ? values[plan.tier]
                  : Number(draft[field.key]);
            const line = budget?.lines?.find(
              (l) => l.id === `stop-${index}-${field.key}`,
            );
            return (
              <div className="preference-field" key={field.key}>
                <div className="preference-label">
                  <Icon size={18} />
                  <label htmlFor={`preference-${field.key}`}>
                    {field.label}
                    <small>{field.unit}</small>
                  </label>
                </div>
                <div className="preference-input">
                  <span>{city.currency}</span>
                  <input
                    id={`preference-${field.key}`}
                    aria-label={`${city.name}${field.label}`}
                    disabled={field.key === "lodging" && !!selectedHotel}
                    type="number"
                    min={0}
                    max={1e7}
                    step="0.01"
                    placeholder={unknown ? '输入预算' : String(values[plan.tier])}
                    value={draft[field.key] ?? ""}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, [field.key]: e.target.value }))
                    }
                  />
                </div>
                {!unknown && <div className="preference-presets">
                  {["经济", "舒适", "宽裕"].map((label, i) => (
                    <button
                      type="button"
                      disabled={field.key === "lodging" && !!selectedHotel}
                      key={label}
                      className={Number(amount) === values[i] ? "active" : ""}
                      onClick={() =>
                        setDraft((p) => ({ ...p, [field.key]: values[i] }))
                      }
                    >
                      {label}
                      <small>{money(values[i], city.currency)}</small>
                    </button>
                  ))}
                </div>}
                {unknown && <p>当地价格待补充，按 USD 输入你愿意花费的金额；这不是当地货币报价。</p>}
                {field.key === "lodging" && selectedHotel && (
                  <p>
                    已选{selectedHotel.name}，按所选房型计费。
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => onOpenCity?.(city.id)}
                    >
                      调整酒店选择
                    </button>
                  </p>
                )}
                {field.key === "food" &&
                  stop.experienceSelections?.length > 0 && (
                    <p>
                      此偏好只用于未选具体餐厅、未由套餐包含的餐次；所选餐厅单独列账。
                    </p>
                  )}
                <p>
                  {city.currency !== plan.currency && (!unknown || draft[field.key] !== '' && draft[field.key] !== undefined)
                    ? `约 ${money(convert(amount, city.currency, plan.currency, rates), plan.currency)} · `
                    : ""}
                  {field.key === "lodging"
                    ? `${plan.rooms} 间房，按实际住宿晚数计算`
                    : `${plan.travelers} 人 × ${stop.days} 天`}
                </p>
                {line?.overridden && (
                  <small className="preference-override">
                    已有全程录入金额 {money(line.amount, plan.currency)}
                    ；修改此偏好会改按单价计费。
                  </small>
                )}
              </div>
            );
          })}
        </div>
        <div className="preference-footer">
          <p>
            金额均为{city.currency}
            {unknown ? '，仅作为输入预算的币种。留空继续标记待补充，不会按免费计算。' : '。留空使用当前档位；这是消费预算，不是实时酒店或餐厅报价。'}
            {plan.mode === "stay" && "旅居住宿以月租 ÷ 30 得到每日参考。"}
          </p>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              onApply(index, {});
              setDraft({ lodging: "", food: "", transport: "" });
            }}
          >
            <RotateCcw size={13} />
            恢复参考
          </button>
          <button
            className="primary-button"
            type="submit"
            disabled={!hasChanges}
          >
            <Check size={15} />
            应用消费偏好
          </button>
        </div>
      </form>
    </div>
  );
}
