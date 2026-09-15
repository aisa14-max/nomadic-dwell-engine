import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { REGIONS, type RegionId } from "@/data/regions";
import continentsGeo from "@/data/continents.geo.json";
import { type Site, getInsights } from "@/data/sites";

mapboxgl.accessToken = MAPBOX_TOKEN;

interface RegionGlobeProps {
  selectedRegion: RegionId | "all";
  onSelect: (region: RegionId) => void;
  className?: string;
  /** Optional [lng, lat] of a site to focus + pin on the globe */
  focusPoint?: [number, number] | null;
  focusLabel?: string;
  focusSite?: Site | null;
  onViewSite?: (site: Site) => void;
  /** Fires once, the first time the user interacts with the globe (drag, scroll, click, or a site focus) */
  onFirstInteract?: () => void;
  /** All sites to render as small dots on the globe (e.g. every site in the currently selected continent) */
  sites?: Site[];
  /** Fires when one of those dots is clicked */
  onSiteClick?: (site: Site) => void;
  /** Fires when the focused-site card's own close (×) button is clicked */
  onClose?: () => void;
}

const SOURCE_ID = "continents";
const LABEL_SOURCE_ID = "continents-labels";
const FILL_LAYER = "continents-fill";
const LINE_LAYER = "continents-line";
const LABEL_LAYER = "continents-label";
const SITES_SOURCE_ID = "region-sites";
const SITES_GLOW_LAYER = "region-sites-glow";
const SITES_DOT_LAYER = "region-sites-dot";
const SITES_HIT_LAYER = "region-sites-hit";

const COUNTRY_LABEL_LAYERS = [
  "country-label",
  "state-label",
  "settlement-major-label",
  "settlement-minor-label",
  "settlement-subdivision-label",
];

const REGION_LABELS_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: REGIONS.map((r) => ({
    type: "Feature",
    properties: { label: r.label },
    geometry: { type: "Point", coordinates: r.center },
  })),
};

export default function RegionGlobe({ selectedRegion, onSelect, className, focusPoint, focusLabel, focusSite, onViewSite, onFirstInteract, sites, onSiteClick, onClose }: RegionGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hoveredRef = useRef<RegionId | null>(null);
  const userInteractedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onFirstInteractRef = useRef(onFirstInteract);
  onFirstInteractRef.current = onFirstInteract;
  const sitesRef = useRef<Site[]>(sites ?? []);
  sitesRef.current = sites ?? [];
  const onSiteClickRef = useRef(onSiteClick);
  onSiteClickRef.current = onSiteClick;
  const markInteracted = () => {
    if (userInteractedRef.current) return;
    userInteractedRef.current = true;
    onFirstInteractRef.current?.();
  };
  const selectedRegionRef = useRef(selectedRegion);
  selectedRegionRef.current = selectedRegion;
  const focusMarkerRef = useRef<mapboxgl.Marker | null>(null);
  // Mapbox needs a WebGL context. When the browser can't provide one (hardware
  // acceleration off, blocklisted GPU, driver trouble), its constructor throws.
  // Uncaught, that throw happens inside an effect and React unmounts the whole
  // tree — the entire page goes black. Degrade to a static panel instead.
  const [glFailed, setGlFailed] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: mapboxgl.Map;
    try {
      // No pre-flight capability check here: mapbox-gl v3 removed the old
      // `supported()` helper, so probing for it reports "unsupported" on every
      // browser. The constructor already throws "Failed to initialize WebGL"
      // when there's no GL context, which is what we catch below.
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        projection: { name: "globe" },
        center: [15, 30],
        zoom: 1.4,
        attributionControl: false,
        logoPosition: "bottom-left",
      });
    } catch (err) {
      console.error("[RegionGlobe] falling back — map could not initialise:", err);
      setGlFailed(true);
      return;
    }
    mapRef.current = map;

    map.on("style.load", () => {
      // Hide default country/place labels from the basemap
      COUNTRY_LABEL_LAYERS.forEach((id) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", "none");
      });

      map.setFog({
        color: "rgb(20, 20, 28)",
        "high-color": "rgb(36, 36, 56)",
        "horizon-blend": 0.15,
        "space-color": "rgb(6, 6, 12)",
        "star-intensity": 0.4,
      });

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: continentsGeo as GeoJSON.FeatureCollection,
        promoteId: "id",
      });

      map.addSource(LABEL_SOURCE_ID, {
        type: "geojson",
        data: REGION_LABELS_GEOJSON,
      });

      map.addLayer({
        id: FILL_LAYER,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": "#ffffff",
          "fill-opacity": [
            "+",
            [
              "case",
              ["boolean", ["feature-state", "selected"], false], 0.28,
              ["boolean", ["feature-state", "hover"], false], 0.18,
              0.06,
            ],
            // Idle "select a continent" invitation — driven every frame by the
            // rotation tick below, zeroed the instant the user interacts.
            ["*", ["coalesce", ["feature-state", "pulse"], 0], 0.16],
          ],
        },
      });

      map.addLayer({
        id: LINE_LAYER,
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": "#ffffff",
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 1.2,
            0.4,
          ],
          "line-opacity": 0.55,
        },
      });

      map.addLayer({
        id: LABEL_LAYER,
        type: "symbol",
        source: LABEL_SOURCE_ID,
        layout: {
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-letter-spacing": 0.15,
          "text-transform": "uppercase",
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
          "symbol-placement": "point",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.55)",
          "text-halo-width": 1.2,
          "text-opacity": 0.85,
        },
      });

      // Site dots — one per site currently passed in via the `sites` prop
      // (e.g. every site in the selected continent). Data starts empty and
      // is synced by the effect below whenever that prop changes.
      map.addSource(SITES_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: SITES_GLOW_LAYER,
        type: "circle",
        source: SITES_SOURCE_ID,
        paint: {
          "circle-radius": 9,
          "circle-color": "#ffffff",
          "circle-opacity": 0.25,
          "circle-blur": 1,
        },
      });
      map.addLayer({
        id: SITES_DOT_LAYER,
        type: "circle",
        source: SITES_SOURCE_ID,
        paint: {
          "circle-radius": 4.5,
          "circle-color": "#ffffff",
          "circle-opacity": 0.95,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255,255,255,0.5)",
        },
      });
      // Invisible, larger circle stacked on top purely as a bigger click/hover
      // target — the visible dot stays small and precise, but you don't have
      // to hit those exact 4-5px for it to register.
      map.addLayer({
        id: SITES_HIT_LAYER,
        type: "circle",
        source: SITES_SOURCE_ID,
        paint: {
          "circle-radius": 16,
          "circle-opacity": 0,
        },
      });
      map.on("mouseenter", SITES_HIT_LAYER, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", SITES_HIT_LAYER, () => { map.getCanvas().style.cursor = ""; });
      map.on("click", SITES_HIT_LAYER, (e) => {
        const title = e.features?.[0]?.properties?.title as string | undefined;
        if (!title) return;
        markInteracted();
        const site = sitesRef.current.find((s) => s.title === title);
        if (site) onSiteClickRef.current?.(site);
      });

      // Hover state — no inline cursor override here: mapbox-gl's own CSS
      // already puts a grab/grabbing cursor on the canvas container for the
      // whole draggable globe, and an inline "pointer" here (continents cover
      // almost the entire sphere) was masking that everywhere, hiding the
      // "you can drag this" affordance under a plain click cursor instead.
      map.on("mousemove", FILL_LAYER, (e) => {
        if (!e.features?.length) return;
        const id = e.features[0].id as RegionId;
        if (hoveredRef.current && hoveredRef.current !== id) {
          map.setFeatureState({ source: SOURCE_ID, id: hoveredRef.current }, { hover: false });
        }
        hoveredRef.current = id;
        map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
      });
      map.on("mouseleave", FILL_LAYER, () => {
        if (hoveredRef.current) {
          map.setFeatureState({ source: SOURCE_ID, id: hoveredRef.current }, { hover: false });
          hoveredRef.current = null;
        }
      });

      // Click select — flyTo happens centrally in the selected-state effect
      // below, so this and the fallback continent-pill list drive the same path.
      map.on("click", FILL_LAYER, (e) => {
        const id = e.features?.[0]?.id as RegionId | undefined;
        if (!id) return;
        markInteracted();
        onSelectRef.current(id);
      });
    });

    // Slow auto-rotation until first interaction (respect reduced motion)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastT = performance.now();
    const tick = (t: number) => {
      const dt = t - lastT;
      lastT = t;
      const notInteracted = !userInteractedRef.current;
      const hintActive = notInteracted && selectedRegionRef.current === "all";
      if (notInteracted && map.isStyleLoaded()) {
        const c = map.getCenter();
        map.setCenter([c.lng + dt * 0.003, c.lat]);
      }
      // Extra rotation synced to the ghost-hand swipe hint (Discover.tsx), so
      // the globe visibly responds while the hand appears to drag it. Timing
      // constants mirror that component's framer-motion loop (2000ms swipe
      // with the drag itself spanning its 0.2–0.85 keyframes, 1300ms pause).
      if (hintActive && map.isStyleLoaded()) {
        const HINT_CYCLE_MS = 3300;
        const DRAG_START_MS = 400;
        const DRAG_END_MS = 1700;
        const HINT_DEGREES = 18;
        const phase = t % HINT_CYCLE_MS;
        if (phase >= DRAG_START_MS && phase < DRAG_END_MS) {
          const dLng = (dt / (DRAG_END_MS - DRAG_START_MS)) * HINT_DEGREES;
          const c = map.getCenter();
          map.setCenter([c.lng + dLng, c.lat]);
        }
      }
      // Soft breathing glow across every continent, inviting the first click —
      // zeroed the instant the user interacts or a region is already picked.
      if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) {
        const pulse = hintActive ? Math.sin(t / 900) * 0.5 + 0.5 : 0;
        REGIONS.forEach((r) => {
          map.setFeatureState({ source: SOURCE_ID, id: r.id }, { pulse });
        });
      }
      raf = requestAnimationFrame(tick);
    };
    const onInteract = () => { markInteracted(); };
    map.on("mousedown", onInteract);
    map.on("touchstart", onInteract);
    map.on("wheel", onInteract);
    if (!prefersReduced) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync selected feature-state + fly to the chosen continent. Single path for
  // both a globe click and the accessible text-pill list (Discover.tsx) — one
  // drives the other via the same `selectedRegion` prop, not two flyTo call sites.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      REGIONS.forEach((r) => {
        map.setFeatureState(
          { source: SOURCE_ID, id: r.id },
          { selected: r.id === selectedRegion },
        );
      });
      if (selectedRegion !== "all") {
        markInteracted();
        const region = REGIONS.find((r) => r.id === selectedRegion);
        if (region) {
          map.flyTo({ center: region.center, zoom: 2.2, duration: 1600, essential: true });
        }
      }
    };
    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) apply();
    else map.once("idle", apply);
  }, [selectedRegion]);

  // Sync the site dots whenever the `sites` prop changes (e.g. switching
  // continents, or narrowing by climate in the sidebar filters).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const source = map.getSource(SITES_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData({
        type: "FeatureCollection",
        features: (sites ?? []).map((s) => ({
          type: "Feature",
          properties: { title: s.title },
          geometry: { type: "Point", coordinates: s.coords },
        })),
      });
    };
    if (map.isStyleLoaded() && map.getSource(SITES_SOURCE_ID)) apply();
    else map.once("idle", apply);
  }, [sites]);

  // Focus pin for a selected site
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!focusPoint) {
      focusMarkerRef.current?.remove();
      focusMarkerRef.current = null;
      return;
    }

    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const buildPopupHtml = (site: Site | null, fallbackLabel?: string) => {
      if (!site) {
        return `<div style="font-family:inherit;font-size:12px;color:#fff;padding:2px 4px">${escapeHtml(fallbackLabel ?? "")}</div>`;
      }
      const ins = getInsights(site);
      const score = ins.nomadScore;
      const scoreHue = score >= 75 ? "rgba(120,255,180,0.9)" : score >= 55 ? "rgba(255,220,130,0.9)" : "rgba(255,150,140,0.9)";
      const scoreGlow = score >= 75 ? "rgba(80,220,150,0.35)" : score >= 55 ? "rgba(240,200,110,0.3)" : "rgba(240,130,120,0.3)";

      const wrenchSvg = `<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.75;flex:none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
      const lockSvg = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

      const pill = (text: string) =>
        `<span style="display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.06);border:0.5px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.85);font-size:12px;line-height:1;white-space:nowrap">${escapeHtml(text)}</span>`;

      const vibeDot = (text: string, i: number) => {
        const dots = ["#7dd3fc", "#fca5a5", "#c4b5fd", "#86efac", "#fcd34d"];
        return `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.85);font-size:12px;line-height:1;white-space:nowrap"><span style="width:5px;height:5px;border-radius:999px;background:${dots[i % dots.length]};box-shadow:0 0 6px ${dots[i % dots.length]}"></span>${escapeHtml(text)}</span>`;
      };

      const adaptChip = (text: string) =>
        `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:6px;background:rgba(255,255,255,0.04);border:0.5px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);font-size:12px;line-height:1;white-space:nowrap">${wrenchSvg}<span>${escapeHtml(text)}</span></span>`;

      const section = (label: string, body: string) =>
        `<div><div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:5px">${label}</div>${body}</div>`;

      return `
<div style="position:relative;width:300px;height:420px;font-family:inherit;color:#fff;margin:-10px;border-radius:14px;overflow:hidden">
  <img src="${escapeHtml(site.image)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block" />
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.05) 30%,rgba(0,0,0,0.75) 60%,rgba(0,0,0,0.97) 100%)"></div>
  <a href="#" data-rg-close="1" aria-label="Close" style="position:absolute;top:12px;right:12px;width:28px;height:28px;border-radius:999px;background:rgba(0,0,0,0.5);border:0.5px solid rgba(255,255,255,0.18);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;color:#fff;text-decoration:none">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  </a>
  <div style="position:absolute;top:12px;left:12px;display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,0.5);border:0.5px solid rgba(255,255,255,0.18);backdrop-filter:blur(10px);font-size:11px;color:${scoreHue};box-shadow:0 0 14px ${scoreGlow}">
    <span style="opacity:0.7;letter-spacing:0.1em;text-transform:uppercase;font-size:9px;color:rgba(255,255,255,0.6)">Nomad</span>
    <span style="font-weight:600">${score}</span>
    <span style="opacity:0.45;font-size:10px">/100</span>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 16px 14px;display:flex;flex-direction:column;gap:10px">
    <div>
      <div style="font-family:'Instrument Serif',serif;font-style:italic;font-size:25px;line-height:1.1;color:#fff;letter-spacing:-0.5px;text-shadow:0 2px 12px rgba(0,0,0,0.8)">${escapeHtml(site.title)}</div>
      <div style="font-size:13px;line-height:1.4;color:rgba(255,255,255,0.8);margin-top:5px">${escapeHtml(ins.tagline)}</div>
    </div>
    ${section("Best nearby", `<div style="display:flex;flex-wrap:wrap;gap:4px">${ins.activities.map(pill).join("")}</div>`)}
    ${section("Community vibe", `<div style="display:flex;flex-wrap:wrap;gap:4px">${ins.vibes.map((v, i) => vibeDot(v, i)).join("")}</div>`)}
    ${section("Engine adaptations", `<div style="display:flex;flex-wrap:wrap;gap:4px">${ins.adaptations.map(adaptChip).join("")}</div>`)}
    ${site.locked
      ? `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:2px;padding:9px 14px;border-radius:999px;background:rgba(255,255,255,0.08);border:0.5px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase">${lockSvg}Coming soon</div>`
      : `<a href="#" data-rg-view="1" style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:2px;padding:9px 14px;border-radius:999px;background:#fff;color:#000;font-size:12px;font-weight:600;text-decoration:none;letter-spacing:0.02em">Configure</a>`}
  </div>
</div>`;
    };

    // Inject popup styles once
    if (!document.getElementById("rg-popup-style")) {
      const style = document.createElement("style");
      style.id = "rg-popup-style";
      style.textContent = `
        .mapboxgl-popup.rg-popup .mapboxgl-popup-content{background:transparent;border:0.5px solid rgba(255,255,255,0.14);border-radius:14px;padding:10px;box-shadow:0 24px 80px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.08);color:#fff;opacity:0;transition:opacity 200ms ease;overflow:hidden;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
        .mapboxgl-popup.rg-popup.rg-popup-visible .mapboxgl-popup-content{opacity:1}
        .mapboxgl-popup.rg-popup .mapboxgl-popup-tip{border-top-color:#111114!important;border-bottom-color:#111114!important;border-left-color:#111114!important;border-right-color:#111114!important}
        .mapboxgl-popup.rg-popup .mapboxgl-popup-close-button{color:rgba(255,255,255,0.6);font-size:18px;padding:4px 8px}
        .mapboxgl-popup.rg-popup a[data-rg-view]:hover{opacity:0.85}
      `;
      document.head.appendChild(style);
    }

    const place = () => {
      // Create or move marker
      if (!focusMarkerRef.current) {
        const el = document.createElement("div");
        el.style.cssText =
          "width:14px;height:14px;border-radius:9999px;background:#ffffff;box-shadow:0 0 0 4px rgba(255,255,255,0.25),0 0 18px 6px rgba(255,255,255,0.55);animation:rg-pulse 1.8s ease-out infinite;";
        // Inject keyframes once
        if (!document.getElementById("rg-pulse-style")) {
          const style = document.createElement("style");
          style.id = "rg-pulse-style";
          style.textContent =
            "@keyframes rg-pulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,0.6),0 0 18px 6px rgba(255,255,255,0.55)}70%{box-shadow:0 0 0 18px rgba(255,255,255,0),0 0 18px 6px rgba(255,255,255,0.55)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0),0 0 18px 6px rgba(255,255,255,0.55)}}";
          document.head.appendChild(style);
        }
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat(focusPoint);
        marker.addTo(map);
        focusMarkerRef.current = marker;
      } else {
        focusMarkerRef.current.setLngLat(focusPoint);
      }

      const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, className: "rg-popup", maxWidth: "none" })
        .setHTML(buildPopupHtml(focusSite ?? null, focusLabel));
      focusMarkerRef.current.setPopup(popup);

      // Show and fade in
      if (!popup.isOpen()) focusMarkerRef.current.togglePopup();
      requestAnimationFrame(() => {
        popup.addClassName("rg-popup-visible");
        const el = popup.getElement();
        const link = el?.querySelector('a[data-rg-view="1"]') as HTMLAnchorElement | null;
        if (link && focusSite && !focusSite.locked && onViewSite) {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            onViewSite(focusSite);
          });
        }
        const closeBtn = el?.querySelector('a[data-rg-close="1"]') as HTMLAnchorElement | null;
        if (closeBtn && onClose) {
          closeBtn.addEventListener("click", (e) => {
            e.preventDefault();
            onClose();
          });
        }
      });

      markInteracted();
      map.flyTo({ center: focusPoint, zoom: 3.6, duration: 1800, essential: true, offset: [0, -180] });
    };
    if (map.isStyleLoaded()) place();
    else map.once("idle", place);
  }, [focusPoint, focusLabel, focusSite, onViewSite, onClose]);


  if (glFailed) {
    return (
      <div
        className={className}
        role="note"
        aria-label="Interactive globe unavailable"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
      >
        <div style={{ maxWidth: "34rem", textAlign: "center" }}>
          <p style={{ fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
            Globe unavailable
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
            This browser couldn't start WebGL, so the interactive globe can't render.
            Every site is still listed below — use the region filters to browse them.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: 12, lineHeight: 1.6, color: "rgba(255,255,255,0.4)" }}>
            To restore it, enable <em>Use graphics acceleration when available</em> in your
            browser settings, then reload.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={className} aria-label="Interactive globe" />;
}
