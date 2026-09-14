import { useEffect, useRef } from "react";
import { Viewer } from "photo-sphere-viewer";
import { MarkersPlugin } from "photo-sphere-viewer/dist/plugins/markers";
import "photo-sphere-viewer/dist/photo-sphere-viewer.css";
import "photo-sphere-viewer/dist/plugins/markers.css";
import "./PanoramaViewer.css";

export interface PanoramaMarker {
  id: string;
  /** Pixel position on this scene's equirectangular source image. */
  x: number;
  y: number;
  onClick: () => void;
}

interface PanoramaViewerProps {
  /** Equirectangular (2:1) source image for the 360° sphere. */
  src: string;
  /** Clickable glowing spotlights layered on the sphere — e.g. a link to another panorama. */
  markers?: PanoramaMarker[];
}

const SPOTLIGHT_HTML = `
  <span class="relative flex items-center justify-center w-11 h-11">
    <span class="absolute inset-0 rounded-full animate-ping" style="background:radial-gradient(circle, rgba(110,190,240,0.55) 0%, rgba(110,190,240,0) 70%)"></span>
    <span class="absolute w-11 h-11 rounded-full blur-md opacity-80" style="background:radial-gradient(circle, rgba(110,190,240,0.65) 0%, rgba(110,190,240,0.25) 45%, rgba(110,190,240,0) 75%)"></span>
    <span class="relative w-3 h-3 rounded-full bg-white"></span>
  </span>
`;

/** Drag-to-look-around 360° viewer for a single equirectangular panorama,
 *  with optional clickable spotlight markers (e.g. linking to another scene). */
export function PanoramaViewer({ src, markers = [] }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  // select-marker's handler is registered once; markers (and their onClick
  // closures) can change on every scene switch, so it reads through a ref
  // instead of needing to re-subscribe.
  const markersRef = useRef<PanoramaMarker[]>(markers);
  markersRef.current = markers;

  // Viewer + markers plugin are created once and kept for the component's
  // lifetime — switching scenes calls setPanorama on this same instance
  // (see below) rather than tearing down and rebuilding the WebGL context.
  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer({
      container: containerRef.current,
      panorama: src,
      navbar: ["zoom", "move", "fullscreen"],
      defaultZoomLvl: 0,
      mousewheel: true,
      touchmoveTwoFingers: true,
      plugins: [MarkersPlugin],
    });
    viewerRef.current = viewer;

    const markersPlugin = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;
    markersPlugin.on("select-marker", (_e, marker) => {
      markersRef.current.find((m) => m.id === marker.id)?.onClick();
    });

    // Markers applied before a panorama has actually finished loading (the
    // very first one, or right after setPanorama() below) compute their
    // visibility against a sphere that isn't in place yet and stay stuck
    // display:none — 'panorama-loaded' is PSV's signal that the new texture
    // and geometry are ready, firing for the initial load and every
    // subsequent setPanorama() alike, so re-applying markers there (rather
    // than on 'ready' or the setPanorama promise) covers both uniformly. The
    // camera/sphere transform for that new geometry still lands one paint
    // later, so the actual re-apply waits a frame or visibility computes
    // against stale state and markers stay stuck invisible regardless.
    viewer.on("panorama-loaded", () => {
      requestAnimationFrame(() => {
        applyMarkers(markersPlugin, markersRef.current);
      });
    });

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the panorama image in place on scene changes (skips the initial
  // mount, which already loaded `src` above via the constructor). Markers
  // are re-applied by the persistent 'panorama-loaded' listener above once
  // this actually finishes, not here.
  const isFirstSrc = useRef(true);
  useEffect(() => {
    if (isFirstSrc.current) {
      isFirstSrc.current = false;
      return;
    }
    viewerRef.current?.setPanorama(src);
  }, [src]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

function applyMarkers(plugin: MarkersPlugin, markers: PanoramaMarker[]) {
  plugin.setMarkers(
    markers.map((m) => ({
      id: m.id,
      x: m.x,
      y: m.y,
      html: SPOTLIGHT_HTML,
      width: 44,
      height: 44,
      anchor: "center center",
    })),
  );
  plugin.renderMarkers();
}
