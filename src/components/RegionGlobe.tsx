import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config/mapbox";
import { REGIONS, type RegionId } from "@/data/regions";
import continentsGeo from "@/data/continents.geo.json";

mapboxgl.accessToken = MAPBOX_TOKEN;

interface RegionGlobeProps {
  selectedRegion: RegionId | "all";
  onSelect: (region: RegionId) => void;
  className?: string;
}

const SOURCE_ID = "continents";
const FILL_LAYER = "continents-fill";
const LINE_LAYER = "continents-line";
const LABEL_LAYER = "continents-label";

export default function RegionGlobe({ selectedRegion, onSelect, className }: RegionGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const hoveredRef = useRef<RegionId | null>(null);
  const userInteractedRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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
        source: SOURCE_ID,
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

  return <div ref={containerRef} className={className} aria-label="Interactive globe" />;
}
