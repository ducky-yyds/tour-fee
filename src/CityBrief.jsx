import React, { useId, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  Compass,
  Info,
  MapPin,
  Route,
  Utensils,
} from "lucide-react";
import { getTripDuration } from "../shared/trip-duration.mjs";
import { OutLink } from "./ui.jsx";
import "./city-brief.css";

const entries = (items) => (Array.isArray(items) ? items : []);
const nameOf = (item) => (typeof item === "string" ? item : item.name);
const names = (items) =>
  entries(items).slice(0, 2).map(nameOf).filter(Boolean).join(" · ");

/** A short visual index, with the full editorial notes available on demand. */
export default function CityBrief({ city, onRestaurants }) {
  const [active, setActive] = useState(null);
  const panelId = useId();
  const guide = city.guide || {};
  const stay = getTripDuration(city);
  const food = entries(guide.foodHighlights);
  const neighborhoods = entries(guide.neighborhoods);
  const facts = [
    {
      id: "stay",
      icon: Clock3,
      label: "适合停留",
      value: stay.label,
      title: "认识这座城",
      tone: "sage",
    },
    ...(food.length
      ? [
          {
            id: "food",
            icon: Utensils,
            label: "当地味道",
            value: names(food),
            title: "当地味道",
            items: food,
            tone: "peach",
          },
        ]
      : []),
    ...(neighborhoods.length
      ? [
          {
            id: "walk",
            icon: MapPin,
            label: "慢逛街区",
            value: names(neighborhoods),
            title: "值得慢逛的地方",
            items: neighborhoods,
            tone: "sand",
          },
        ]
      : []),
    ...(city.transportNote
      ? [
          {
            id: "transport",
            icon: Route,
            label: "如何出行",
            value: city.transportNote.split(/[。；\n]/)[0],
            title: "交通指南",
            tone: "blue",
          },
        ]
      : []),
  ];
  const selected = facts.find((fact) => fact.id === active);
  return (
    <section className="ch-brief" aria-label={`${city.name}城市速览`}>
      <div className="ch-brief-heading">
        <h2>
          <Compass size={17} aria-hidden="true" />
          城市速览
        </h2>
        <span className="ch-brief-currency">
          当地币种 <b>{city.currency}</b>
        </span>
        <button
          type="button"
          className="ch-brief-toggle"
          aria-expanded={Boolean(selected)}
          aria-controls={panelId}
          onClick={() => setActive(selected ? null : "stay")}
        >
          {selected ? "收起细节" : "展开细节"}
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
      <div className="ch-brief-facts">
        {facts.map(({ id, icon: Icon, label, value, tone }) => (
          <button
            type="button"
            key={id}
            className={`ch-brief-fact is-${tone}${active === id ? " is-active" : ""}`}
            aria-expanded={active === id}
            aria-controls={panelId}
            aria-label={`${label}：${value}，${active === id ? "收起" : "展开"}详情`}
            onClick={() => setActive(active === id ? null : id)}
          >
            <span className="ch-brief-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="ch-brief-fact-text">
              <small>{label}</small>
              <strong title={value}>{value}</strong>
            </span>
          </button>
        ))}
      </div>
      <div id={panelId} className="ch-brief-detail" hidden={!selected}>
        {selected && (
          <>
            <div className="ch-brief-detail-heading">
              <h3>{selected.title}</h3>
              {active === "food" && (
                <button
                  type="button"
                  className="text-button"
                  onClick={onRestaurants}
                >
                  餐厅与预算
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
            {active === "stay" && (
              <div className="ch-brief-about">
                <p>{guide.intro || city.description}</p>
                <p>{stay.reason}</p>
              </div>
            )}
            {selected.items && (
              <ul className="ch-brief-notes">
                {selected.items.map((item, index) => (
                  <li key={nameOf(item) || index}>
                    <strong>{nameOf(item)}</strong>
                    {item.description && <p>{item.description}</p>}
                  </li>
                ))}
              </ul>
            )}
            {active === "transport" && (
              <p className="ch-brief-transport">{city.transportNote}</p>
            )}
            {(city.budgetBasis?.note || city.officialTourismUrl) && (
              <div className="ch-brief-sources">
                {city.budgetBasis?.note && (
                  <details>
                    <summary>
                      <Info size={14} />
                      费用估算说明
                    </summary>
                    <p>{city.budgetBasis.note}</p>
                  </details>
                )}
                {city.officialTourismUrl && (
                  <OutLink href={city.officialTourismUrl}>
                    官方目的地指南
                  </OutLink>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
