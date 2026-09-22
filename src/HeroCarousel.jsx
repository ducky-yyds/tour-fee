import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { assetUrl } from "./api.mjs";
import "./hero-carousel.css";
const EMPTY_IMAGES = Object.freeze([]);

function citySlides(city, additional = []) {
  const candidates = [
    { image: city?.image, title: `${city?.name || "目的地"}城市实景` },
    ...additional.map((item) => ({
      image: item.image || item,
      title:
        item.title || item.name || item.image?.alt || item.alt || city?.name,
    })),
    ...(city?.attractions || [])
      .filter(
        (place) =>
          place.image?.url?.startsWith("/") &&
          !place.image.url.startsWith("//"),
      )
      .map((place) => ({ image: place.image, title: place.name })),
  ];
  const urls = new Set();
  return candidates
    .filter((slide) => {
      if (!slide.image?.url || urls.has(slide.image.url)) return false;
      urls.add(slide.image.url);
      return true;
    })
    .slice(0, 6);
}

/** Absolute photo layer for an existing .hero; the parent retains its own copy. */
export default function HeroCarousel({ city, images = EMPTY_IMAGES }) {
  const keyboardHelpId = useId();
  const candidates = useMemo(() => citySlides(city, images), [city, images]);
  const [failed, setFailed] = useState(() => new Set());
  const slides = useMemo(
    () => candidates.filter((slide) => !failed.has(slide.image.url)),
    [candidates, failed],
  );
  const [index, setIndex] = useState(0),
    [previous, setPrevious] = useState(null);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const root = useRef(null);
  const activeIndex = slides.length ? index % slides.length : 0;
  const current = slides[activeIndex];
  const running =
    slides.length > 1 && !paused && !hovered && !focused && !hidden;
  const indices = [...new Set([activeIndex, previous])].filter(
    (value) => value !== null && value >= 0 && value < slides.length,
  );
  const sourceUrl = /^https?:\/\//.test(current?.image?.sourceUrl || "")
    ? current.image.sourceUrl
    : "";

  useEffect(() => {
    setIndex(0);
    setPrevious(null);
    setFailed(new Set());
  }, [city?.id]);
  useEffect(() => {
    const host = root.current?.closest(".hero") || root.current;
    const enter = (event) => {
      if (event.pointerType === "mouse") setHovered(true);
    };
    const leave = (event) => {
      if (event.pointerType === "mouse") setHovered(false);
    };
    const focusIn = () => setFocused(true);
    const focusOut = (event) => {
      if (!host.contains(event.relatedTarget)) setFocused(false);
    };
    const visibility = () => setHidden(document.hidden);
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = (event) => setPaused(event.matches);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("focusin", focusIn);
    host.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", visibility);
    preference.addEventListener("change", motion);
    return () => {
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("focusin", focusIn);
      host.removeEventListener("focusout", focusOut);
      document.removeEventListener("visibilitychange", visibility);
      preference.removeEventListener("change", motion);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    const timeout = setTimeout(() => {
      setPrevious(activeIndex);
      setIndex((activeIndex + 1) % slides.length);
    }, 6500);
    return () => clearTimeout(timeout);
  }, [running, activeIndex, slides.length, city?.id]);
  useEffect(() => {
    if (slides.length < 2 || hidden) return;
    const next = new Image();
    next.decoding = "async";
    next.src = assetUrl(slides[(activeIndex + 1) % slides.length].image.url);
    return () => {
      next.onload = null;
      next.onerror = null;
    };
  }, [activeIndex, slides, hidden]);

  function select(nextIndex) {
    if (!slides.length) return;
    setPrevious(activeIndex);
    setIndex((nextIndex + slides.length) % slides.length);
  }
  function keyboard(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const targets = {
      ArrowLeft: activeIndex - 1,
      ArrowRight: activeIndex + 1,
      Home: 0,
      End: slides.length - 1,
    };
    if (Object.hasOwn(targets, event.key)) {
      event.preventDefault();
      select(targets[event.key]);
    }
  }

  return (
    <div
      className="hero-carousel"
      ref={root}
      role="region"
      aria-roledescription="轮播图"
      aria-label={`${city?.name || "目的地"}风景照片`}
      data-testid="hero-carousel"
      data-index={activeIndex}
      data-count={slides.length}
      data-playing={running ? "true" : "false"}
      data-paused={paused ? "true" : "false"}
      onKeyDown={keyboard}
    >
      <div className="hc-images" aria-live="off">
        {indices.map((slideIndex) => {
          const slide = slides[slideIndex];
          return (
            <img
              key={`${city?.id}-${slide.image.url}`}
              className={`hc-photo ${slideIndex === activeIndex ? "is-active" : ""}`}
              src={assetUrl(slide.image.url)}
              alt={
                slideIndex === activeIndex
                  ? `${city?.name || ""} · ${slide.title}`
                  : ""
              }
              aria-hidden={slideIndex !== activeIndex}
              loading={slideIndex === 0 ? "eager" : "lazy"}
              fetchPriority={slideIndex === 0 ? "high" : "auto"}
              decoding="async"
              onError={() =>
                setFailed((value) => new Set([...value, slide.image.url]))
              }
            />
          );
        })}
        {!slides.length && (
          <div
            className="hc-empty"
            role="img"
            aria-label={`${city?.name || "目的地"}城市图片待补充`}
          >
            <MapPin size={35} />
            <span>{city?.name} · 城市图片待补充</span>
          </div>
        )}
      </div>
      <div className="hc-caption" aria-live={running ? "off" : "polite"}>
        <span className="hc-title" title={current?.title || "城市图片待补充"}>
          {current?.title || "城市图片待补充"}
        </span>
        {current &&
          (sourceUrl ? (
            <a
              className="hc-credit"
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`${current.title} · 摄影：${current.image.credit || "查看图片来源"}${current.image.license ? ` · ${current.image.license}` : ""}`}
            >
              摄影：{current.image.credit || "查看图片来源"}
              {current.image.license && <span> · {current.image.license}</span>}
            </a>
          ) : (
            <span className="hc-credit">
              {current.image.credit || "目的地实景"}
            </span>
          ))}
      </div>
      {slides.length > 1 && (
        <div
          className="hc-dots"
          role="group"
          aria-label="选择背景照片"
          aria-describedby={keyboardHelpId}
        >
          {slides.map((slide, i) => (
            <button
              key={slide.image.url}
              type="button"
              aria-label={`查看第 ${i + 1} 张照片：${slide.title}`}
              aria-pressed={i === activeIndex}
              onClick={() => select(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
      <span className="hc-accessible" id={keyboardHelpId}>
        聚焦或悬停时暂停轮播，可用左右方向键切换照片。系统减少动态效果时不会自动播放。
      </span>
    </div>
  );
}
