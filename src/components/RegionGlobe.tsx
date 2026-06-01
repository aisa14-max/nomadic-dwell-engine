import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { REGIONS, type RegionId } from "@/data/regions";
import continentsGeo from "@/data/continents.geo.json";
import type { Site } from "@/data/sites";

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
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat(focusPoint);
        if (focusLabel) {
          marker.setPopup(
            new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
              `<div style="font-family:sans-serif;font-size:12px;color:#111;padding:2px 4px">${focusLabel}</div>`
            )
          );
        }
        marker.addTo(map);
        focusMarkerRef.current = marker;
      } else {
        focusMarkerRef.current.setLngLat(focusPoint);
        if (focusLabel) {
          focusMarkerRef.current.setPopup(
            new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
              `<div style="font-family:sans-serif;font-size:12px;color:#111;padding:2px 4px">${focusLabel}</div>`
            )
          );
        }
      }
      focusMarkerRef.current.togglePopup();
      userInteractedRef.current = true;
      map.flyTo({ center: focusPoint, zoom: 3.6, duration: 1800, essential: true });
    };
    if (map.isStyleLoaded()) place();
    else map.once("idle", place);
  }, [focusPoint, focusLabel]);

  return <div ref={containerRef} className={className} aria-label="Interactive globe" />;
}
