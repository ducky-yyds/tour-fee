import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { geoEqualEarth, geoGraticule10, geoPath } from "d3-geo";
import { Compass, Hand, Minus, Plus, RotateCcw } from "lucide-react";
import { ISO2_TO_NUMERIC } from "../shared/country-codes.mjs";
import { cityPoint } from "../shared/globe.mjs";
import "./flat-world-map.css";

const WIDTH = 1000;
const HEIGHT = 560;
const MAX_ZOOM = 7;
const SPHERE = { type: "Sphere" };
const numericCode = (value) => String(value ?? "").padStart(3, "0");
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const ISO_BY_NUMBER = Object.fromEntries(
  Object.entries(ISO2_TO_NUMERIC).map(([code, number]) => [numericCode(number), code]),
);

function constrainView({ k, x, y }) {
  const zoom = clamp(k, 1, MAX_ZOOM);
  return { k: zoom, x: clamp(x, WIDTH * (1 - zoom), 0), y: clamp(y, HEIGHT * (1 - zoom), 0) };
}

function countryName(destination, locale) {
  return locale === "en"
    ? destination?.nameEn || destination?.name || ""
    : destination?.name || destination?.nameEn || "";
}

/** A stable, country-first atlas. Coordinates remain geographic; small areas get pin targets. */
export default function FlatWorldMap({
  countries = [],
  destinations = [],
  selectedCountryCode = "",
  onSelectCountry,
  mapError = false,
  onRetry,
  locale = "zh",
}) {
  const en = locale === "en";
  const instanceId = useId().replace(/:/g, "");
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickUntil = useRef(0);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hoverCode, setHoverCode] = useState("");
  const [touchPan, setTouchPan] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pixelRatio, setPixelRatio] = useState(1);
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return undefined;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      // The SVG can be shorter than its viewBox ratio on desktop. Equal-sized
      // map controls and labels must use the actual meet scale, including letterboxing.
      const scale = Math.min(width / WIDTH, height / HEIGHT);
      if (scale > 0) setPixelRatio(1 / scale);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const destinationByCode = useMemo(
    () => new Map(destinations.map((destination) => [destination.countryCode, destination])),
    [destinations],
  );
  const projection = useMemo(
    () => geoEqualEarth().fitExtent([[20, 38], [WIDTH - 20, HEIGHT - 42]], SPHERE),
    [],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const graticulePath = useMemo(() => path(geoGraticule10()), [path]);
  const spherePath = useMemo(() => path(SPHERE), [path]);
  const features = useMemo(
    () => countries.map((country, index) => {
      const code = ISO_BY_NUMBER[numericCode(country.id)];
      return {
        feature: country,
        key: `${country.id ?? "country"}-${index}`,
        code,
        d: path(country),
        area: path.area(country),
        centroid: path.centroid(country),
      };
    }),
    [countries, path],
  );
  const featureByCode = useMemo(
    () => new Map(features.filter((item) => item.code).map((item) => [item.code, item])),
    [features],
  );
  const pins = useMemo(() => destinations.flatMap((destination) => {
    const feature = featureByCode.get(destination.countryCode);
    // Keep ordinary small countries clickable through their own boundaries.
    // Oversized pins on Switzerland / Belgium otherwise steal nearby country clicks.
    if (feature && feature.area > 10 && !["HK", "MO"].includes(destination.countryCode)) return [];
    // The first real destination anchors islands and territories absent from the atlas.
    const point = destination.cities.map(cityPoint).find(Boolean);
    if (!point) return [];
    const projected = projection(point);
    if (!projected?.every(Number.isFinite)) return [];
    return [{ ...destination, point: projected }];
  }), [destinations, featureByCode, projection]);
  const pinByCode = useMemo(() => new Map(pins.map((pin) => [pin.countryCode, pin])), [pins]);
  const activeCode = hoverCode || selectedCountryCode;
  const activeDestination = destinationByCode.get(activeCode);
  const activeAnchor = pinByCode.get(activeCode)?.point || featureByCode.get(activeCode)?.centroid;
  const activePosition = activeAnchor?.every(Number.isFinite)
    ? { x: clamp(activeAnchor[0] * view.k + view.x, 105 * pixelRatio, WIDTH - 105 * pixelRatio), y: clamp(activeAnchor[1] * view.k + view.y - 22 * pixelRatio, 30 * pixelRatio, HEIGHT - 35 * pixelRatio) }
    : null;

  function zoomBy(factor) {
    setView((previous) => {
      const k = clamp(previous.k * factor, 1, MAX_ZOOM);
      const ratio = k / previous.k;
      return constrainView({ k, x: WIDTH / 2 - (WIDTH / 2 - previous.x) * ratio, y: HEIGHT / 2 - (HEIGHT / 2 - previous.y) * ratio });
    });
  }

  function selectCountry(code) {
    if (destinationByCode.has(code) && performance.now() >= suppressClickUntil.current) {
      onSelectCountry?.(code);
    }
  }

  function countryKeyDown(event, code) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    onSelectCountry?.(code);
  }

  function mapKeyDown(event) {
    if (event.target !== event.currentTarget) return;
    if (["+", "="].includes(event.key)) { event.preventDefault(); zoomBy(1.4); }
    else if (event.key === "-") { event.preventDefault(); zoomBy(1 / 1.4); }
    else if (event.key === "Home") { event.preventDefault(); setView({ k: 1, x: 0, y: 0 }); }
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      setView((previous) => constrainView({
        ...previous,
        x: previous.x + (event.key === "ArrowLeft" ? 65 : event.key === "ArrowRight" ? -65 : 0),
        y: previous.y + (event.key === "ArrowUp" ? 65 : event.key === "ArrowDown" ? -65 : 0),
      }));
    }
  }

  function pointerDown(event) {
    if (event.button !== 0 || view.k <= 1 || (event.pointerType === "touch" && !touchPan)) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view, moved: false };
  }

  function pointerMove(event) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    if (!drag.moved) {
      drag.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
      setHoverCode("");
    }
    const bounds = svgRef.current.getBoundingClientRect();
    const scale = Math.min(bounds.width / WIDTH, bounds.height / HEIGHT);
    setView(constrainView({ k: drag.view.k, x: drag.view.x + dx / scale, y: drag.view.y + dy / scale }));
  }

  function pointerEnd(event) {
    if (dragRef.current?.id !== event.pointerId) return;
    if (dragRef.current.moved) suppressClickUntil.current = performance.now() + 350;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const description = en
    ? "Select a highlighted country to browse its cities. Use the zoom buttons, then drag to move the map. On touch screens, enable Move map first. Keyboard: plus or minus to zoom, arrow keys to move, Home to reset."
    : "点击有颜色的国家查看可选城市。放大后可拖动地图；触屏请先开启移动地图。键盘加减键缩放，方向键移动，Home 恢复全图。";

  return (
    <div className={`fwm-map${dragging ? " is-dragging" : ""}${touchPan ? " is-touch-pan" : ""}`}>
      <div className="fwm-map-caption" aria-hidden="true">
        <span className="fwm-caption-kicker">WORLD ATLAS</span>
        <span>{en ? "A country opens a world of cities" : "从一个国家，发现更多城市"}</span>
      </div>
      <div className="fwm-compass" aria-hidden="true"><span>N</span><Compass size={30} strokeWidth={1.15} /></div>
      <svg
        ref={svgRef}
        className={`fwm-svg${view.k > 1 ? " can-pan" : ""}`}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        tabIndex={0}
        role="group"
        aria-label={en ? "Interactive world map" : "交互式世界地图"}
        aria-describedby={`${instanceId}-description`}
        onKeyDown={mapKeyDown}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
        onPointerLeave={() => {
          if (!dragRef.current?.moved) {
            dragRef.current = null;
            setHoverCode("");
          }
        }}
      >
        <desc id={`${instanceId}-description`}>{description}</desc>
        <defs>
          <linearGradient id={`${instanceId}-ocean`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d9ebe3" />
            <stop offset="100%" stopColor="#b9d8d0" />
          </linearGradient>
          <clipPath id={`${instanceId}-clip`}><rect width={WIDTH} height={HEIGHT} /></clipPath>
        </defs>
        <g clipPath={`url(#${instanceId}-clip)`}>
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            <path d={spherePath} fill={`url(#${instanceId}-ocean)`} className="fwm-ocean" />
            <path d={graticulePath} className="fwm-graticule" />
            {features.map((item) => {
              const destination = destinationByCode.get(item.code);
              const selected = selectedCountryCode === item.code;
              const name = countryName(destination, locale);
              return (
                <path
                  key={item.key}
                  d={item.d || undefined}
                  className={`fwm-country${destination ? " is-available" : ""}${selected ? " is-selected" : ""}${hoverCode === item.code ? " is-hovered" : ""}`}
                  role={destination ? "button" : undefined}
                  tabIndex={destination && !pinByCode.has(item.code) ? 0 : undefined}
                  aria-label={destination ? (en ? `Explore ${name}` : `探索${name}`) : undefined}
                  aria-pressed={destination ? selected : undefined}
                  aria-hidden={destination ? undefined : true}
                  onPointerEnter={destination ? () => { if (!dragRef.current?.moved) setHoverCode(item.code); } : undefined}
                  onPointerLeave={destination ? () => setHoverCode("") : undefined}
                  onFocus={destination ? () => setHoverCode(item.code) : undefined}
                  onBlur={destination ? () => setHoverCode("") : undefined}
                  onClick={destination ? () => selectCountry(item.code) : undefined}
                  onKeyDown={destination ? (event) => countryKeyDown(event, item.code) : undefined}
                >
                  {destination && <title>{name}</title>}
                </path>
              );
            })}
            {pins.map((pin) => {
              const selected = selectedCountryCode === pin.countryCode;
              const name = countryName(pin, locale);
              // Hong Kong and Macao are close at world scale. Fixed short leaders preserve both anchors.
              const offset = pin.countryCode === "HK" ? [12, -11] : pin.countryCode === "MO" ? [-12, 13] : [0, 0];
              return (
                <g
                  key={pin.countryCode}
                  transform={`translate(${pin.point[0]},${pin.point[1]}) scale(${pixelRatio / view.k})`}
                  className={`fwm-pin${selected ? " is-selected" : ""}${hoverCode === pin.countryCode ? " is-hovered" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={en ? `Explore ${name}` : `探索${name}`}
                  aria-pressed={selected}
                  onPointerEnter={() => { if (!dragRef.current?.moved) setHoverCode(pin.countryCode); }}
                  onPointerLeave={() => setHoverCode("")}
                  onFocus={() => setHoverCode(pin.countryCode)}
                  onBlur={() => setHoverCode("")}
                  onClick={() => selectCountry(pin.countryCode)}
                  onKeyDown={(event) => countryKeyDown(event, pin.countryCode)}
                >
                  <title>{name}</title>
                  {(offset[0] || offset[1]) !== 0 && <line x1="0" y1="0" x2={offset[0]} y2={offset[1]} className="fwm-pin-leader" />}
                  <circle cx={offset[0]} cy={offset[1]} r="8" className="fwm-pin-hit" />
                  <circle cx={offset[0]} cy={offset[1]} r="5.4" className="fwm-pin-dot" />
                  <circle cx={offset[0]} cy={offset[1]} r="1.5" className="fwm-pin-center" />
                </g>
              );
            })}
          </g>
        </g>
        {activeDestination && activePosition && !dragging && (
          <g transform={`translate(${activePosition.x},${activePosition.y}) scale(${pixelRatio})`} className="fwm-tooltip" aria-hidden="true">
            <foreignObject x="-110" y="-24" width="220" height="45">
              <div className="fwm-country-tooltip"><span>{countryName(activeDestination, locale)}</span></div>
            </foreignObject>
          </g>
        )}
      </svg>
      <div className="fwm-map-legend">
        <span><i className="fwm-legend-available" />{en ? "Explore cities" : "可探索城市"}</span>
        <span><i className="fwm-legend-other" />{en ? "Coming later" : "待补充"}</span>
      </div>
      <div className="fwm-map-controls" role="group" aria-label={en ? "Map controls" : "地图操作"}>
        <button type="button" className={`fwm-touch-pan${touchPan ? " is-active" : ""}`} aria-pressed={touchPan} onClick={() => {
          if (!touchPan && view.k === 1) zoomBy(1.6);
          setTouchPan((previous) => !previous);
        }} title={en ? "Enable touch dragging" : "开启后可在触屏上拖动地图"}>
          <Hand size={16} /><span>{en ? "Move map" : "移动地图"}</span>
        </button>
        <button type="button" disabled={view.k >= MAX_ZOOM} onClick={() => zoomBy(1.4)} aria-label={en ? "Zoom in" : "放大地图"} title={en ? "Zoom in" : "放大地图"}><Plus size={18} /></button>
        <button type="button" disabled={view.k <= 1} onClick={() => zoomBy(1 / 1.4)} aria-label={en ? "Zoom out" : "缩小地图"} title={en ? "Zoom out" : "缩小地图"}><Minus size={18} /></button>
        <button type="button" onClick={() => { setView({ k: 1, x: 0, y: 0 }); setTouchPan(false); }} aria-label={en ? "Reset world map" : "恢复世界全图"} title={en ? "Reset world map" : "恢复世界全图"}><RotateCcw size={16} /></button>
      </div>
      {mapError && <div className="fwm-map-status" role="status">
        <p>{en ? "Map outlines could not load. You can still choose a country from the list." : "地图轮廓暂未加载，可继续从国家列表选择。"}</p>
        {onRetry && <button type="button" onClick={onRetry}>{en ? "Reload map" : "重新加载地图"}</button>}
      </div>}
      {!mapError && countries.length === 0 && <div className="fwm-map-status" role="status"><p>{en ? "Loading the world map…" : "正在展开世界地图…"}</p></div>}
    </div>
  );
}
