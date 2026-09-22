import React, { useState } from "react";
import { ArrowUpRight, MapPin, Search, Utensils } from "lucide-react";
import { Photo, OutLink } from "./ui.jsx";
import "./local-food.css";

export default function LocalFoodGuide({ city }) {
  const [query, setQuery] = useState("");
  const foods = (city.localFoods || []).filter((food) =>
    [food.name, food.localName, food.description]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const searchUrl = (food, place) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([food.localName || food.name, place?.name, city.nameEn || city.name, city.country].filter(Boolean).join(" "))}`;
  return (
    <section className="ch-food-guide" aria-label={`${city.name}特色食物`}>
      <div className="ch-food-intro">
        <p>
          先认识一种味道，再找喜欢的小店。
          <small>
            餐食已包含在日常饮食预算中；下方是寻找食物的线索，实际菜单与价格在店内确认。
          </small>
        </p>
      </div>
      <label className="ch-search ch-food-search">
        <Search size={17} />
        <input
          aria-label="搜索特色食物"
          placeholder="搜索食物或当地名称"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="ch-food-grid">
        {foods.map((food) => (
          <article className="ch-food-card" key={food.id}>
            <div className="ch-food-photo">
              {food.image?.url ? (
                <Photo image={food.image} alt={food.name} />
              ) : (
                <div className="ch-food-placeholder">
                  <Utensils size={32} />
                  <span>{food.name}</span>
                </div>
              )}
              {food.image?.url && (
                <div className="ch-food-credit">
                  <a
                    href={food.image.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {food.image.credit || "图片来源"}
                  </a>
                  {food.image.license && (
                    <a
                      href={food.image.licenseUrl || food.image.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {food.image.license}
                    </a>
                  )}
                </div>
              )}
            </div>
            <div className="ch-food-body">
              <h3>{food.name}</h3>
              {food.localName && (
                <span className="ch-food-local-name">{food.localName}</span>
              )}
              <p>{food.description}</p>
              {food.servingNote && (
                <p className="ch-food-serving">{food.servingNote}</p>
              )}
              <div className="ch-food-where">
                <h4>
                  <MapPin size={14} />
                  在哪里寻找
                </h4>
                {(food.places || []).length ? (
                  food.places.map((place, index) => (
                    <div key={`${place.name}-${index}`}>
                      <a
                        href={searchUrl(food, place)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {place.name}
                        <ArrowUpRight size={13} />
                      </a>
                      <small>
                        {place.note ||
                          (place.kind === "restaurant"
                            ? "前往前确认菜单与营业时间。"
                            : "可以从这片区域寻找，具体店铺与菜单请以检索结果为准。")}
                      </small>
                      {place.kind === "restaurant" && place.sourceUrl && (
                        <OutLink href={place.sourceUrl}>推荐出处</OutLink>
                      )}
                    </div>
                  ))
                ) : (
                  <a
                    href={searchUrl(food)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    在{city.name}找这道食物
                    <ArrowUpRight size={13} />
                  </a>
                )}
              </div>
              <div className="ch-food-footer">
                {food.sourceUrl && (
                  <OutLink href={food.sourceUrl}>
                    {food.sourceScope === "destination-context"
                      ? "城市指南参考"
                      : "食物介绍来源"}
                  </OutLink>
                )}
                <a
                  className="text-button"
                  href={searchUrl(food)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  找一家尝尝
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!foods.length && (
        <p className="ch-empty">
          {query
            ? "换个食物名称试试。"
            : "当地食物资料正在补充，也可以先看看餐厅与套餐。"}
        </p>
      )}
    </section>
  );
}
