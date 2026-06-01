import { useEffect, useRef } from "react";
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
}

const SOURCE_ID = "continents";
const LABEL_SOURCE_ID = "continents-labels";
const FILL_LAYER = "continents-fill";
const LINE_LAYER = "continents-line";
const LABEL_LAYER = "continents-label";

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

export default function RegionGlobe({ selectedRegion, onSelect, className, focusPoint, focusLabel, focusSite, onViewSite }: RegionGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hoveredRef = useRef<RegionId | null>(null);
  const userInteractedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const focusMarkerRef = useRef<mapboxgl.Marker | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      projection: { name: "globe" },
      center: [15, 30],
      zoom: 1.4,
      attributionControl: false,
      logoPosition: "bottom-left",
    });
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
            "case",
            ["boolean", ["feature-state", "selected"], false], 0.28,
            ["boolean", ["feature-state", "hover"], false], 0.18,
            0.06,
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

      // Hover state
      map.on("mousemove", FILL_LAYER, (e) => {
        if (!e.features?.length) return;
        const id = e.features[0].id as RegionId;
        if (hoveredRef.current && hoveredRef.current !== id) {
          map.setFeatureState({ source: SOURCE_ID, id: hoveredRef.current }, { hover: false });
        }
        hoveredRef.current = id;
        map.setFeatureState({ source: SOURCE_ID, id }, { hover: true });
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", FILL_LAYER, () => {
        if (hoveredRef.current) {
          map.setFeatureState({ source: SOURCE_ID, id: hoveredRef.current }, { hover: false });
          hoveredRef.current = null;
        }
        map.getCanvas().style.cursor = "";
      });

      // Click select
      map.on("click", FILL_LAYER, (e) => {
        const id = e.features?.[0]?.id as RegionId | undefined;
        if (!id) return;
        userInteractedRef.current = true;
        onSelectRef.current(id);
        const region = REGIONS.find((r) => r.id === id);
        if (region) {
          map.flyTo({ center: region.center, zoom: 2.2, duration: 1600, essential: true });
        }
      });
    });

    // Slow auto-rotation until first interaction (respect reduced motion)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let lastT = performance.now();
    const tick = (t: number) => {
      const dt = t - lastT;
      lastT = t;
      if (!userInteractedRef.current && map.isStyleLoaded()) {
        const c = map.getCenter();
        map.setCenter([c.lng + dt * 0.003, c.lat]);
      }
      raf = requestAnimationFrame(tick);
    };
    const onInteract = () => { userInteractedRef.current = true; };
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

  // Sync selected feature-state
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
    };
    if (map.isStyleLoaded() && map.getSource(SOURCE_ID)) apply();
    else map.once("idle", apply);
  }, [selectedRegion]);

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
      const iconSvg = (path: string) =>
        `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.7;flex:none">${path}</svg>`;
      const ICONS = {
        thermo: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
        rain: '<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>',
        dollar: '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        wifi: '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
        shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
      };
      const chip = (icon: string, value: string) =>
        `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border-radius:999px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.82);font-size:10px;line-height:1;white-space:nowrap">${iconSvg(icon)}<span>${escapeHtml(value)}</span></span>`;

      return `
<div style="display:flex;flex-direction:column;gap:8px;width:248px;font-family:inherit;color:#fff">
  <div style="display:flex;gap:10px;align-items:flex-start">
    <img src="${escapeHtml(site.image)}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid rgba(255,255,255,0.1);flex:none" />
    <div style="min-width:0;flex:1">
      <div style="font-style:italic;font-size:14px;line-height:1.15;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(site.title)}</div>
      <div style="font-size:11px;line-height:1.2;color:rgba(255,255,255,0.55);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(site.region)}</div>
    </div>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:4px">
    ${chip(ICONS.thermo, site.temperature)}
    ${chip(ICONS.rain, site.rainfall)}
    ${chip(ICONS.dollar, site.costOfLiving)}
    ${chip(ICONS.wifi, site.internetSpeed)}
    ${chip(ICONS.shield, site.safety)}
  </div>
  <div style="display:flex;justify-content:flex-end;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px">
    <a href="#" data-rg-view="1" style="font-size:11px;color:#fff;text-decoration:none;letter-spacing:0.02em">View site →</a>
  </div>
</div>`;
    };

    // Inject popup styles once
    if (!document.getElementById("rg-popup-style")) {
      const style = document.createElement("style");
      style.id = "rg-popup-style";
      style.textContent = `
        .mapboxgl-popup.rg-popup .mapboxgl-popup-content{background:#111114;border:0.5px solid rgba(255,255,255,0.12);border-radius:12px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,0.5);color:#fff;opacity:0;transition:opacity 200ms ease}
        .mapboxgl-popup.rg-popup.rg-popup-visible .mapboxgl-popup-content{opacity:1}
        .mapboxgl-popup.rg-popup .mapboxgl-popup-tip{border-top-color:#111114!important;border-bottom-color:#111114!important;border-left-color:#111114!important;border-right-color:#111114!important}
        .mapboxgl-popup.rg-popup .mapboxgl-popup-close-button{color:rgba(255,255,255,0.6);font-size:18px;padding:4px 8px}
        .mapboxgl-popup.rg-popup a[data-rg-view]:hover{text-decoration:underline}
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
        if (link && focusSite && onViewSite) {
          link.addEventListener("click", (e) => {
            e.preventDefault();
            onViewSite(focusSite);
          });
        }
      });

      userInteractedRef.current = true;
      map.flyTo({ center: focusPoint, zoom: 3.6, duration: 1800, essential: true });
    };
    if (map.isStyleLoaded()) place();
    else map.once("idle", place);
  }, [focusPoint, focusLabel, focusSite, onViewSite]);


  return <div ref={containerRef} className={className} aria-label="Interactive globe" />;
}
