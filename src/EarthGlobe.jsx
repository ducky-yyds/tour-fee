import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { assetUrl } from "./api.mjs";
import * as THREE from "three";
import { geoDistance, geoInterpolate, geoOrthographic, geoPath } from "d3-geo";
import { ArrowUpRight, Check, Cloud, Globe2, MapPin, X } from "lucide-react";
import { ISO2_TO_NUMERIC } from "../shared/country-codes.mjs";
import {
  cityPoint,
  normalizeRotation,
  rotationForCity,
} from "../shared/globe.mjs";
import {
  earthVector,
  projectEarthVector,
  layoutCityLabels,
  sampleCityPoints,
  hoverCardPosition,
} from "../shared/globe-visual.mjs";
import { Photo } from "./ui.jsx";
import "./earth-globe.css";

const RAD = Math.PI / 180;
const numericCode = (value) => String(value ?? "").padStart(3, "0");
const clampZoom = (value) => Math.max(0.7, Math.min(4.6, value));
const SPHERE = { type: "Sphere" };

function createEarth(canvas, onReady, onError) {
  const compact =
    canvas.clientWidth < 560 ||
    window.matchMedia("(pointer: coarse), (max-width: 760px)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 20);
  camera.position.z = 4;
  const globe = new THREE.Group();
  scene.add(globe);
  const geometry = new THREE.SphereGeometry(1, 112, 72);
  const surface = new THREE.MeshPhongMaterial({
    color: "#ffffff",
    shininess: 7,
    specular: "#162e3a",
  });
  const earth = new THREE.Mesh(geometry, surface);
  earth.rotation.y = -Math.PI / 2;
  globe.add(earth);
  const cloudMaterial = new THREE.MeshLambertMaterial({
    color: "#fffdf6",
    transparent: true,
    opacity: 0.19,
    depthWrite: false,
  });
  const clouds = new THREE.Mesh(geometry, cloudMaterial);
  clouds.scale.setScalar(1.006);
  clouds.rotation.y = -Math.PI / 2;
  clouds.visible = false;
  globe.add(clouds);
  const airMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexShader:
      "varying vec3 vNormal; void main(){ vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader:
      "varying vec3 vNormal; void main(){ float rim = pow(1.0 - max(0.0, normalize(vNormal).z), 3.4); gl_FragColor = vec4(0.20,0.56,1.0,rim*0.68); }",
  });
  const air = new THREE.Mesh(geometry, airMaterial);
  air.scale.setScalar(1.018);
  scene.add(air);
  scene.add(new THREE.AmbientLight("#bad6ff", 1.12));
  const sun = new THREE.DirectionalLight("#fff6df", 2.55);
  sun.position.set(-3, 3, 5);
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#457dae", 0.3);
  fill.position.set(3, -1, 1);
  scene.add(fill);
  let disposed = false,
    hasClouds = false,
    showClouds = true;
  const textures = [];
  const requests = new AbortController();
  const render = () => {
    if (!disposed) renderer.render(scene, camera);
  };

  async function loadTexture(url, requestedWidth, color = false) {
    const width = Math.min(
      requestedWidth,
      renderer.capabilities.maxTextureSize,
    );
    const height = Math.max(1, Math.round(width / 2));
    const response = await fetch(assetUrl(url), { signal: requests.signal });
    if (!response.ok) throw new Error("Earth texture unavailable");
    const blob = await response.blob();
    let source,
      releaseSource,
      bitmap = false;
    try {
      if (typeof createImageBitmap === "function") {
        try {
          source = await createImageBitmap(blob, {
            resizeWidth: width,
            resizeHeight: height,
            resizeQuality: "high",
            imageOrientation: "flipY",
            premultiplyAlpha: "none",
            colorSpaceConversion: "none",
          });
          bitmap = true;
          const image = source;
          releaseSource = () => image.close();
        } catch (error) {
          if (disposed || requests.signal.aborted) throw error;
          // Browsers with partial ImageBitmap support use a bounded canvas.
        }
      }
      if (!source) {
        const objectUrl = URL.createObjectURL(blob);
        const image = new Image();
        const abortImage = () => {
          image.src = "";
        };
        requests.signal.addEventListener("abort", abortImage, { once: true });
        try {
          image.src = objectUrl;
          await image.decode();
          if (disposed) return null;
          const resized = document.createElement("canvas");
          resized.width = width;
          resized.height = height;
          const context = resized.getContext("2d");
          if (!context) throw new Error("Earth texture decode unavailable");
          context.drawImage(image, 0, 0, width, height);
          source = resized;
          releaseSource = () => {
            resized.width = 1;
            resized.height = 1;
          };
        } finally {
          requests.signal.removeEventListener("abort", abortImage);
          image.src = "";
          URL.revokeObjectURL(objectUrl);
        }
      }
      if (disposed || requests.signal.aborted) {
        releaseSource?.();
        return null;
      }
      const texture = new THREE.Texture(source);
      texture.flipY = !bitmap;
      texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      texture.anisotropy = Math.min(
        compact ? 4 : 8,
        renderer.capabilities.getMaxAnisotropy(),
      );
      texture.needsUpdate = true;
      textures.push({ texture, releaseSource });
      return texture;
    } catch (error) {
      releaseSource?.();
      throw error;
    }
  }

  // Decode directly to the display budget. The original NASA files stay intact;
  // the 5400 px source is never retained as a full-size mobile GPU texture.
  loadTexture("/maps/earth-day.jpg", compact ? 2048 : 4096, true)
    .then(async (texture) => {
      if (!texture || disposed) return;
      surface.map = texture;
      surface.needsUpdate = true;
      render();
      onReady();
      // Serial decoding keeps the temporary image peak bounded on phones.
      const cloudsTexture = await loadTexture(
        "/maps/earth-clouds.jpg",
        compact ? 1024 : 2048,
      ).catch(() => null);
      if (!cloudsTexture || disposed) return;
      cloudMaterial.alphaMap = cloudsTexture;
      cloudMaterial.needsUpdate = true;
      hasClouds = true;
      clouds.visible = showClouds;
      render();
    })
    .catch(() => {
      if (!disposed) onError("texture");
    });
  return {
    draw(rotation, width, height, radius, cloudLayer) {
      if (disposed) return;
      if (
        canvas.clientWidth !== width ||
        canvas.width !== Math.round(width * renderer.getPixelRatio()) ||
        canvas.height !== Math.round(height * renderer.getPixelRatio())
      )
        renderer.setSize(width, height, false);
      camera.left = -width / (2 * radius);
      camera.right = width / (2 * radius);
      camera.top = height / (2 * radius);
      camera.bottom = -height / (2 * radius);
      camera.updateProjectionMatrix();
      const longitude = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotation[0] * RAD,
      );
      const latitude = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        -rotation[1] * RAD,
      );
      globe.quaternion.copy(latitude.multiply(longitude));
      showClouds = cloudLayer;
      clouds.visible = hasClouds && showClouds;
      render();
    },
    dispose(forceContextLoss = false) {
      if (disposed) return;
      disposed = true;
      requests.abort();
      surface.map = null;
      cloudMaterial.alphaMap = null;
      textures.forEach(({ texture, releaseSource }) => {
        texture.dispose();
        releaseSource?.();
        texture.image = null;
      });
      textures.length = 0;
      geometry.dispose();
      surface.dispose();
      cloudMaterial.dispose();
      airMaterial.dispose();
      renderer.dispose();
      // StrictMode can reuse the mounted canvas after an effect cleanup.
      if (forceContextLoss || !canvas.isConnected) renderer.forceContextLoss();
    },
  };
}

export default function EarthGlobe({
  cities,
  selectedId,
  selected,
  rotation,
  setRotation,
  zoom,
  setZoom,
  countries,
  visited,
  visitedCountries,
  mode,
  route,
  onSelect,
  budgetLabel,
}) {
  const surfaceRef = useRef(null),
    canvasRef = useRef(null),
    pointsCanvas = useRef(null),
    earthRef = useRef(null);
  const drag = useRef(null),
    touchPoints = useRef(new Map()),
    hoverTimer = useRef(null),
    animation = useRef(null);
  const reduced = useRef(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [size, setSize] = useState({ width: 720, height: 610 });
  const [displayRotation, setDisplayRotation] = useState(rotation);
  const currentRotation = useRef(rotation);
  const [ready, setReady] = useState(false),
    [fallback, setFallback] = useState(false);
  const [cloudLayer, setCloudLayer] = useState(true),
    [hoverId, setHoverId] = useState("");
  const gradientId = useId().replace(/:/g, "");
  const radius = Math.min(size.width * 0.424, size.height * 0.412) * zoom;
  const routeCityIds = useMemo(
    () => new Set(route.stops.map((stop) => stop.city.id)),
    [route],
  );
  const geographicCities = useMemo(
    () =>
      cities
        .map((city) => ({ city, vector: earthVector(city) }))
        .filter((item) => item.vector),
    [cities],
  );
  const rankedCities = useMemo(
    () =>
      geographicCities
        .map((item) => ({
          ...item,
          priority:
            item.city.id === selectedId
              ? 1000
              : mode === "routes" && routeCityIds.has(item.city.id)
                ? 600
                : mode === "passport" && visited.has(item.city.id)
                  ? 500
                  : item.city.coverage !== "airport-only"
                    ? 80
                    : item.city.scheduledService
                      ? 30
                      : Math.min(
                          15,
                          item.city.airportCount ||
                            item.city.airportIds?.length ||
                            1,
                        ),
        }))
        .sort((a, b) => b.priority - a.priority),
    [geographicCities, selectedId, routeCityIds, visited, mode],
  );
  const projected = useMemo(() => {
    const output = [];
    for (const item of rankedCities) {
      if (
        zoom < 2.1 &&
        item.city.coverage === "airport-only" &&
        !item.city.scheduledService &&
        item.priority < 500
      )
        continue;
      const point = projectEarthVector(
        item.vector,
        displayRotation,
        size.width,
        size.height,
        radius,
      );
      if (
        point.depth > 0.025 &&
        point.x > -10 &&
        point.x < size.width + 10 &&
        point.y > 45 &&
        point.y < size.height - 45
      )
        output.push({ ...item, ...point });
    }
    return sampleCityPoints(output, zoom < 1.8 ? 10 : 7);
  }, [rankedCities, displayRotation, radius, size]);
  const labels = useMemo(
    () =>
      layoutCityLabels(projected, {
        ...size,
        limit: size.width < 500 ? 17 : zoom < 1.5 ? 34 : 46,
        reserved: [
          { x: size.width - 123, y: 58, width: 109, height: 43 },
          { x: 18, y: size.height - 84, width: 142, height: 20 },
        ],
      }),
    [projected, size, zoom],
  );
  const projection = useMemo(
    () =>
      geoOrthographic()
        .translate([size.width / 2, size.height / 2])
        .scale(radius)
        .rotate(displayRotation)
        .clipAngle(90),
    [size, radius, displayRotation],
  );
  const path = useMemo(() => geoPath(projection), [projection]);
  const hovered = projected.find((point) => point.city.id === hoverId);
  const hoverPosition = hovered
    ? hoverCardPosition(hovered, size.width, size.height)
    : null;

  useEffect(() => {
    const node = surfaceRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width),
        height = Math.round(entry.contentRect.height);
      if (width > 0 && height > 0)
        setSize((previous) =>
          previous.width === width && previous.height === height
            ? previous
            : { width, height },
        );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let earth;
    try {
      earth = createEarth(
        canvasRef.current,
        () => setReady(true),
        () => {
          setReady(false);
          setFallback(true);
        },
      );
      earthRef.current = earth;
      earth.draw(
        currentRotation.current,
        size.width,
        size.height,
        radius,
        cloudLayer,
      );
    } catch {
      setFallback(true);
    }
    const lost = (event) => {
      event.preventDefault();
      setReady(false);
      setFallback(true);
    };
    const canvas = canvasRef.current;
    canvas.addEventListener("webglcontextlost", lost);
    const pageHide = (event) => {
      // A full reload does not unmount React. Release buffers before the next
      // document starts decoding textures; keep BFCache restores usable.
      if (!event.persisted) {
        canvas.removeEventListener("webglcontextlost", lost);
        earth?.dispose(true);
        earthRef.current = null;
      }
    };
    window.addEventListener("pagehide", pageHide);
    return () => {
      window.removeEventListener("pagehide", pageHide);
      canvas.removeEventListener("webglcontextlost", lost);
      earth?.dispose();
      earthRef.current = null;
    };
  }, []);
  useEffect(() => {
    earthRef.current?.draw(
      displayRotation,
      size.width,
      size.height,
      radius,
      cloudLayer,
    );
  }, [displayRotation, size, radius, cloudLayer]);
  useEffect(() => {
    cancelAnimationFrame(animation.current);
    if (drag.current || reduced.current) {
      currentRotation.current = rotation;
      setDisplayRotation(rotation);
      return;
    }
    const start = currentRotation.current;
    const delta = ((rotation[0] - start[0] + 540) % 360) - 180;
    const begin = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - begin) / 480),
        easing = 1 - Math.pow(1 - t, 3);
      const next = [
        start[0] + delta * easing,
        start[1] + (rotation[1] - start[1]) * easing,
        0,
      ];
      currentRotation.current = next;
      setDisplayRotation(next);
      if (t < 1) animation.current = requestAnimationFrame(tick);
    };
    animation.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animation.current);
  }, [rotation]);
  useEffect(() => {
    const canvas = pointsCanvas.current,
      dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size.width * dpr);
    canvas.height = Math.round(size.height * dpr);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(dpr, dpr);
    for (let i = projected.length - 1; i >= 0; i--) {
      const p = projected[i],
        airport = p.city.coverage === "airport-only",
        prominent = p.priority >= 500;
      context.globalAlpha =
        airport && !prominent
          ? mode === "explore"
            ? 0.34
            : 0.16
          : prominent
            ? 1
            : mode === "explore"
              ? 0.85
              : 0.32;
      if (prominent) {
        context.beginPath();
        context.arc(
          p.x,
          p.y,
          p.city.id === selectedId ? 9 : 6.5,
          0,
          Math.PI * 2,
        );
        context.fillStyle = "#eed0a640";
        context.fill();
      }
      context.beginPath();
      context.arc(
        p.x,
        p.y,
        prominent ? 3.4 : airport ? 1.3 : 2.2,
        0,
        Math.PI * 2,
      );
      context.fillStyle = prominent
        ? "#ffe0a7"
        : airport
          ? "#b7d7e4"
          : "#f7faf6";
      context.fill();
      if (!airport || prominent) {
        context.strokeStyle = "#143447";
        context.lineWidth = 0.8;
        context.stroke();
      }
    }
  }, [projected, size, mode, selectedId]);
  useEffect(() => {
    const node = surfaceRef.current;
    const wheel = (event) => {
      if (
        document.activeElement !== node &&
        !node.contains(document.activeElement)
      )
        return;
      event.preventDefault();
      setHoverId("");
      setZoom((value) => clampZoom(value - event.deltaY * 0.0015));
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, [setZoom]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  function showHover(id) {
    clearTimeout(hoverTimer.current);
    setHoverId(id);
  }
  function hideHover() {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverId(""), 220);
  }
  function nearestCity(event) {
    const rect = surfaceRef.current.getBoundingClientRect(),
      x = event.clientX - rect.left,
      y = event.clientY - rect.top;
    let best = null,
      distance = event.pointerType === "touch" ? 22 : 10;
    for (const point of projected) {
      const next = Math.hypot(point.x - x, point.y - y);
      if (next < distance) {
        best = point;
        distance = next;
      }
    }
    return best;
  }
  function pointerDown(event) {
    if (
      event.target.closest("button, .eg-hover-card") ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return;
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    touchPoints.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    cancelAnimationFrame(animation.current);
    setHoverId("");
    const points = [...touchPoints.current.values()];
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      vx: 0,
      vy: 0,
      rotation: currentRotation.current,
      zoom,
      moved: false,
      pinch:
        points.length === 2
          ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
          : 0,
    };
  }
  function pointerMove(event) {
    if (event.target.closest(".eg-hover-card")) return;
    if (!drag.current) {
      const label = event.target.closest(".eg-city-label");
      if (label) {
        showHover(label.dataset.cityId);
        return;
      }
      if (event.target.closest("button")) return;
      if (event.pointerType === "mouse") {
        const nearest = nearestCity(event);
        if (nearest) showHover(nearest.city.id);
        else if (!event.target.closest(".eg-city-label")) hideHover();
      }
      return;
    }
    touchPoints.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const state = drag.current,
      points = [...touchPoints.current.values()];
    if (points.length === 2 && state.pinch > 0) {
      state.moved = true;
      setZoom(
        clampZoom(
          (state.zoom *
            Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)) /
            state.pinch,
        ),
      );
      return;
    }
    const dx = event.clientX - state.x,
      dy = event.clientY - state.y;
    if (Math.hypot(dx, dy) > 4) state.moved = true;
    const elapsed = Math.max(
      8,
      event.timeStamp - (state.lastTime || event.timeStamp),
    );
    state.vx = (event.clientX - (state.lastX ?? event.clientX)) / elapsed;
    state.vy = (event.clientY - (state.lastY ?? event.clientY)) / elapsed;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    state.lastTime = event.timeStamp;
    const next = normalizeRotation([
      state.rotation[0] + (dx * 90) / radius,
      state.rotation[1] - (dy * 90) / radius,
      0,
    ]);
    currentRotation.current = next;
    setDisplayRotation(next);
    setRotation(next);
  }
  function pointerUp(event) {
    const state = drag.current;
    touchPoints.current.delete(event.pointerId);
    if (state && !state.moved) {
      const point = nearestCity(event);
      if (point) {
        onSelect(point.city, false);
        showHover(point.city.id);
      }
    }
    if (touchPoints.current.size) {
      const point = [...touchPoints.current.values()][0];
      drag.current = {
        ...point,
        rotation: currentRotation.current,
        zoom,
        moved: true,
        pinch: 0,
      };
    } else {
      drag.current = null;
      // A brief ease-out after a flick; no continuous rotation or animation loop.
      if (
        state?.moved &&
        !state.pinch &&
        !reduced.current &&
        event.timeStamp - state.lastTime < 90
      ) {
        const momentum = (60 * 90) / radius;
        const dx = Math.max(-18, Math.min(18, (state.vx || 0) * momentum));
        const dy = Math.max(-14, Math.min(14, (state.vy || 0) * momentum));
        if (Math.hypot(dx, dy) > 0.5)
          setRotation(
            normalizeRotation([
              currentRotation.current[0] + dx,
              currentRotation.current[1] - dy,
              0,
            ]),
          );
      }
    }
  }
  function keyboard(event) {
    if (event.key === "Escape") {
      setHoverId("");
      return;
    }
    if (event.target !== surfaceRef.current) return;
    const directions = {
      ArrowLeft: [-12, 0],
      ArrowRight: [12, 0],
      ArrowUp: [0, -10],
      ArrowDown: [0, 10],
    };
    if (directions[event.key]) {
      event.preventDefault();
      const [x, y] = directions[event.key];
      setHoverId("");
      setRotation((value) =>
        normalizeRotation([value[0] + x, value[1] + y, 0]),
      );
    }
    if (["+", "=", "-"].includes(event.key)) {
      event.preventDefault();
      setZoom((value) => clampZoom(value + (event.key === "-" ? -0.2 : 0.2)));
    }
    if (event.key === "Home") {
      event.preventDefault();
      setRotation(rotationForCity(selected));
      setZoom(1);
    }
  }
  function routeArrow(leg) {
    const interpolate = geoInterpolate(
      cityPoint(leg.from.city),
      cityPoint(leg.to.city),
    );
    const a = interpolate(0.56),
      b = interpolate(0.58),
      center = [-displayRotation[0], -displayRotation[1]];
    if (
      geoDistance(a, center) > Math.PI / 2 - 0.03 ||
      geoDistance(b, center) > Math.PI / 2 - 0.03
    )
      return null;
    const p = projection(a),
      q = projection(b);
    return (
      <path
        key={leg.id}
        d="M -5 -3 L 1 0 L -5 3"
        className="gl-route-arrow"
        transform={`translate(${p[0]},${p[1]}) rotate(${Math.atan2(q[1] - p[1], q[0] - p[0]) / RAD})`}
      />
    );
  }
  return (
    <div
      ref={surfaceRef}
      className={`eg-surface gl-sphere ${size.width < 500 ? "is-compact" : ""} ${ready && !fallback ? "is-webgl-ready" : "is-vector-map"}`}
      role="group"
      aria-label="可交互地球：拖动旋转，悬停城市预览，方向键旋转，加减键缩放，Home 键回到所选城市"
      aria-describedby="gl-map-help"
      tabIndex={0}
      data-renderer={ready && !fallback ? "webgl" : "vector"}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => {
        drag.current = null;
        touchPoints.current.clear();
      }}
      onPointerLeave={hideHover}
      onKeyDown={keyboard}
    >
      <div className="eg-starlight" aria-hidden="true" />
      <div
        className="eg-atmosphere"
        aria-hidden="true"
        style={{ width: radius * 2 + 40, height: radius * 2 + 40 }}
      />
      <canvas className="eg-earth-canvas" ref={canvasRef} aria-hidden="true" />
      <svg
        className="eg-map-overlay"
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`${gradientId}-ocean`} cx="32%" cy="27%" r="78%">
            <stop offset="0" stopColor="#164765" />
            <stop offset=".7" stopColor="#0b2a43" />
            <stop offset="1" stopColor="#03111f" />
          </radialGradient>
          <clipPath id={`${gradientId}-clip`}>
            <path d={path(SPHERE) || ""} />
          </clipPath>
        </defs>
        <path
          className="eg-vector-ocean"
          d={path(SPHERE) || ""}
          fill={`url(#${gradientId}-ocean)`}
        />
        <g clipPath={`url(#${gradientId}-clip)`}>
          {countries.map((country) => (
            <path
              key={country.id}
              data-country={country.id}
              d={path(country) || ""}
              className={`gl-country ${mode === "passport" && visitedCountries.has(numericCode(country.id)) ? "is-visited" : ""} ${mode === "explore" && numericCode(country.id) === numericCode(ISO2_TO_NUMERIC[selected?.countryCode]) ? "is-selected" : ""}`}
            />
          ))}
          {mode === "routes" &&
            route.legs.map((leg) => (
              <path
                key={leg.id}
                data-testid="globe-route-leg"
                data-from={leg.from.city.id}
                data-to={leg.to.city.id}
                d={path(leg.geometry) || ""}
                className="gl-route-line"
              >
                <title>
                  {leg.from.city.name} → {leg.to.city.name} · 规划示意
                </title>
              </path>
            ))}
          {mode === "routes" && route.legs.map(routeArrow)}
        </g>
      </svg>
      <canvas
        className="eg-points-canvas"
        ref={pointsCanvas}
        aria-hidden="true"
      />
      <div className="eg-label-layer" aria-label="地球上的城市">
        {labels.map((point) => (
          <button
            key={point.city.id}
            type="button"
            className={`eg-city-label ${point.city.id === selectedId ? "is-selected" : ""} ${visited.has(point.city.id) ? "is-visited" : ""} ${point.city.coverage === "airport-only" ? "is-airport" : ""}`}
            data-city-id={point.city.id}
            style={{
              left: point.box.x,
              top: point.box.y,
              width: point.box.width,
            }}
            aria-label={`${point.city.name}，${point.city.country}${visited.has(point.city.id) ? "，已打卡" : ""}`}
            onPointerEnter={() => showHover(point.city.id)}
            onPointerLeave={hideHover}
            onFocus={() => showHover(point.city.id)}
            onBlur={hideHover}
            onClick={() => {
              onSelect(point.city, false);
              showHover(point.city.id);
            }}
          >
            {point.city.name}
          </button>
        ))}
      </div>
      <div className="eg-view-tools">
        <button
          type="button"
          className={cloudLayer ? "is-on" : ""}
          aria-pressed={cloudLayer}
          aria-label="显示云层"
          title="历史卫星云层"
          onClick={() => setCloudLayer((value) => !value)}
        >
          <Cloud size={15} />
          <span>云层</span>
        </button>
        <span className="eg-north" aria-hidden="true">
          N<i />
        </span>
      </div>
      {hovered && (
        <div
          className="eg-hover-card"
          data-testid="globe-city-preview"
          role="dialog"
          aria-label={`${hovered.city.name}目的地预览`}
          style={hoverPosition}
          onPointerEnter={() => showHover(hoverId)}
          onPointerLeave={hideHover}
          onFocus={() => showHover(hoverId)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) hideHover();
          }}
        >
          <button
            type="button"
            className="eg-hover-close"
            aria-label="关闭城市预览"
            onClick={() => setHoverId("")}
          >
            <X size={13} />
          </button>
          <div className="eg-hover-visual">
            {hovered.city.image?.url ? (
              <Photo
                image={hovered.city.image}
                alt={`${hovered.city.name}风景`}
              />
            ) : (
              <div className="eg-city-placeholder">
                <Globe2 size={35} />
                <span>机场位置 · 图片待补充</span>
              </div>
            )}
            {visited.has(hovered.city.id) && (
              <span className="eg-hover-visited">
                <Check size={11} />
                已去过
              </span>
            )}
          </div>
          <div className="eg-hover-body">
            <div>
              <strong>{hovered.city.name}</strong>
              <span>{hovered.city.country}</span>
            </div>
            <p>
              {hovered.city.coverage === "airport-only"
                ? `${hovered.city.airportCodes?.slice(0, 3).join(" · ") || hovered.city.iata || "机场节点"} · 生活成本待补充`
                : budgetLabel(hovered.city) + " / 天"}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelect(hovered.city, false);
                setHoverId("");
              }}
            >
              <MapPin size={12} />
              查看目的地
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      )}
      {fallback && (
        <span className="eg-fallback-note" role="status">
          当前使用轻量地图 · 仍可探索城市
        </span>
      )}
      <span className="eg-satellite-caption">
        {ready && !fallback ? "NASA · BLUE MARBLE" : "WORLD ATLAS"}
      </span>
    </div>
  );
}
