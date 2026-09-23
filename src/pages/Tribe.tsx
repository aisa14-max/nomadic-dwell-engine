import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, MousePointer2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import BlurText from "@/components/BlurText";
import StartOverButton from "@/components/StartOverButton";
import { useMockAuth, type AvatarId } from "@/context/MockAuth";
import { SITES } from "@/data/sites";
import {
  CHAPTERS, CONNECTIONS, INTENTIONS, PEOPLE, TRIBES,
  chapterRadius, haversineKm, nearestChapter, rankTribes,
  tribeInfo, tribeLinks, tribeMembers, tribeOf,
  type Chapter, type Intention, type Person, type Tribe, type TribeLink,
} from "@/data/tribe";
import {
  TRIBE_KEYS, WRAPUP_EVENT, loadExchangeRequests, loadIntros, loadJSON, loadMyTribeId,
  readBrief, saveExchangeRequests, saveJSON, saveMyTribeId, setWrapUpEligible,
  type ExchangeRequest,
} from "@/lib/tribeStore";
import atlas from "@/assets/cosmic-atlas.jpg";
import oceanMask from "@/assets/ocean-mask.png";
import avatar1 from "@/assets/avatars/avatar-1.jpg";
import avatar2 from "@/assets/avatars/avatar-2.jpg";
import avatar3 from "@/assets/avatars/avatar-3.jpg";
import avatar4 from "@/assets/avatars/avatar-4.jpg";
import avatar5 from "@/assets/avatars/avatar-5.jpg";
import avatar6 from "@/assets/avatars/avatar-6.jpg";

const AVATAR_IMAGES: Record<AvatarId, string> = {
  a1: avatar1, a2: avatar2, a3: avatar3, a4: avatar4, a5: avatar5, a6: avatar6,
};

// ── Placing people on the map ────────────────────────────────────────────────
// The background is a Miller-style world map, not plain lat/lng, drawn
// "cover"-style. These constants were fitted against the land mask so that
// real coordinates land where they appear on the artwork.
const ATLAS = { w: 1920, h: 1080 };
const millerY = (lat: number) =>
  1.25 * Math.log(Math.tan(Math.PI / 4 + (0.4 * Math.max(-89, Math.min(89, lat)) * Math.PI) / 180));
const MAP_TOP = millerY(86.5);
const MAP_BOTTOM = millerY(-79);
const toUV = (lat: number, lng: number) => ({
  u: (lng - 8) / 370 + 0.5,
  v: (MAP_TOP - millerY(lat)) / (MAP_TOP - MAP_BOTTOM),
});
// The artwork always fully covers the screen (like CSS background-size: cover) —
// scaled up to whichever axis needs it more, then centred and cropped on the
// other, so there's never a bare edge, on any aspect ratio.
const uvToScreen = (uv: { u: number; v: number }, w: number, h: number) => {
  const scale = Math.max(w / ATLAS.w, h / ATLAS.h);
  const iw = ATLAS.w * scale;
  const ih = ATLAS.h * scale;
  return { x: (w - iw) / 2 + uv.u * iw, y: (h - ih) / 2 + uv.v * ih };
};
const project = (lat: number, lng: number, w: number, h: number) => uvToScreen(toUV(lat, lng), w, h);

// Coastal cities sit on a thin strip of land, so a few land a pixel or two out
// to sea. Once the mask has loaded, each person is nudged to the nearest solid land.
type LandTools = {
  W: number;
  H: number;
  solid: (x: number, y: number) => boolean;
  land: (x: number, y: number) => boolean;
  nearest: (px: number, py: number, ok: (x: number, y: number) => boolean) => { x: number; y: number } | null;
};
let landTools: LandTools | null = null;
const snapCache = new Map<string, { u: number; v: number }>();
let landSnap: Promise<void> | null = null;
function loadLandSnap(): Promise<void> {
  if (landSnap) return landSnap;
  landSnap = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, W, H).data;
        const land = (x: number, y: number) => {
          const xi = Math.round(x);
          const yi = Math.round(y);
          return xi >= 0 && yi >= 0 && xi < W && yi < H && data[(yi * W + xi) * 4] < 128;
        };
        const solid = (x: number, y: number) =>
          land(x, y) && land(x + 1, y) && land(x - 1, y) && land(x, y + 1) && land(x, y - 1);
        const nearest = (px: number, py: number, ok: (x: number, y: number) => boolean) => {
          if (ok(px, py)) return { x: px, y: py };
          for (let r = 1; r <= 16; r++) {
            for (let a = 0; a < 24; a++) {
              const th = (a / 24) * Math.PI * 2;
              const x = px + Math.cos(th) * r;
              const y = py + Math.sin(th) * r;
              if (ok(x, y)) return { x, y };
            }
          }
          return null;
        };
        landTools = { W, H, solid, land, nearest };
      } catch { /* mask unreadable — leave people where the projection puts them */ }
      resolve();
    };
    img.onerror = () => resolve();
    img.src = oceanMask;
  });
  return landSnap;
}

const snapUV = (key: string, lat: number, lng: number) => {
  const hit = snapCache.get(key);
  if (hit) return hit;
  const raw = toUV(lat, lng);
  if (!landTools) return raw; // mask not ready yet — don't cache
  const { W, H, solid, land, nearest } = landTools;
  const found = nearest(raw.u * W, raw.v * H, solid) ?? nearest(raw.u * W, raw.v * H, land);
  const uv = found ? { u: found.x / W, v: found.y / H } : raw;
  snapCache.set(key, uv);
  return uv;
};

const placePerson = (p: Person, w: number, h: number) => uvToScreen(snapUV(p.id, p.lat, p.lng), w, h);
const placeSpot = (lat: number, lng: number, w: number, h: number) =>
  uvToScreen(snapUV(`spot:${lat},${lng}`, lat, lng), w, h);

type Presence = { visible: boolean; anonymous: boolean; cityOnly: boolean; showLines: boolean };
const DEFAULT_PRESENCE: Presence = { visible: true, anonymous: false, cityOnly: true, showLines: true };

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TribePage() {
  const { user } = useMockAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onboarding = useMemo(readBrief, []);
  const you = onboarding?.site ?? null;
  // Arriving from Voyages ("9 tribe members near here") or from a chapter's
  // own hand-off: skip the intro and land on the closest chapter.
  const arrival = (location.state as { near?: { lat: number; lng: number; label?: string } } | null)?.near ?? null;

  const arrivalChapterId = useMemo(
    () => (arrival ? nearestChapter(arrival.lat, arrival.lng)?.id ?? null : null),
    [arrival],
  );

  const [layer, setLayer] = useState(arrival ? 1 : 0);
  const [interactions, setInteractions] = useState(arrival ? 4 : 0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  // Wrap-up nudge lives in the nav (see Nav.tsx's "Ready to wrap up?"), in
  // the same spot Start Over sits on every other page — this just tracks
  // whether it should glow: either enough clicking around, or having
  // actually opened Creators (the tribe behind the app), which alone is
  // "explored enough" even with a low click count.
  const [exploredCreators, setExploredCreators] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const wrapUpEligible = interactions >= 6 || exploredCreators;
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(arrivalChapterId);
  const [showTribes, setShowTribes] = useState(false);
  const [selectedTribeId, setSelectedTribeId] = useState<string | null>(null);
  const [myTribeId, setMyTribeId] = useState<string | null>(loadMyTribeId);
  const [justJoined, setJustJoined] = useState<Tribe | null>(null);
  const [showPresence, setShowPresence] = useState(false);
  const [presence, setPresence] = useState<Presence>(() => loadJSON(TRIBE_KEYS.presence, DEFAULT_PRESENCE));
  const [intros, setIntros] = useState<Record<string, string>>(loadIntros);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangeRequest[]>(loadExchangeRequests);
  const [showEntryHint, setShowEntryHint] = useState(!arrival);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // Hovering a tribe chip lights that tribe's dots without committing to it.
  const [previewTribeId, setPreviewTribeId] = useState<string | null>(null);
  // The bottom bar grows when a tribe opens; the person card keeps clear of it.
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(130);
  const barMounted = layer >= 1;
  useEffect(() => {
    const el = barRef.current;
    if (!barMounted || !el) return;
    const measure = () => setBarH(el.getBoundingClientRect().height + 20);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [barMounted]);
  const [landReady, setLandReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadLandSnap().then(() => { if (alive) setLandReady(true); });
    return () => { alive = false; };
  }, []);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const posRef = useRef<{ x: number; y: number; p: Person }[]>([]);
  const youPosRef = useRef<{ x: number; y: number } | null>(null);

  // The canvas loop reads everything through this ref, so hovering or
  // selecting never restarts it (a restart re-seeded the drift and made dots jump).
  const liveRef = useRef({
    layer, hovered, selected, selectedTribeId, previewTribeId, selectedChapterId, myTribeId,
    showLines: presence.showLines, youVisible: presence.visible, youAnonymous: presence.anonymous, you,
  });
  liveRef.current = {
    layer, hovered, selected, selectedTribeId, previewTribeId, selectedChapterId, myTribeId,
    showLines: presence.showLines, youVisible: presence.visible, youAnonymous: presence.anonymous, you,
  };

  const bump = () => setInteractions((n) => n + 1);

  const updatePresence = (patch: Partial<Presence>) =>
    setPresence((p) => {
      const next = { ...p, ...patch };
      saveJSON(TRIBE_KEYS.presence, next);
      return next;
    });

  const joinTribe = (t: Tribe) => {
    setMyTribeId(t.id);
    setSelectedTribeId(t.id);
    saveMyTribeId(t.id);
    setJustJoined(t);
  };

  const sendIntro = (t: Tribe, text: string) => {
    const next = { ...intros, [t.id]: text };
    setIntros(next);
    saveJSON(TRIBE_KEYS.intros, next);
    toast.success(`Intro sent to ${tribeMembers.get(t.id)?.length ?? 0} members of ${t.name}`);
  };

  const requestExchange = (p: Person) => {
    if (exchangeRequests.some((r) => r.id === p.id)) return;
    const next = [...exchangeRequests, { id: p.id, at: Date.now() }];
    setExchangeRequests(next);
    saveExchangeRequests(next);
    toast.success(`Exchange request sent to ${p.alias} in ${p.city}`, {
      action: { label: "View in Profile", onClick: () => navigate("/profile") },
    });
  };

  const selectPerson = (id: string) => {
    setSelected(id);
    setSelectedChapterId(null);
    setShowTribes(false);
    setShowPresence(false);
    setShowEntryHint(false);
    setMessagingOpen(false);
    setMessageDraft("");
    bump();
  };

  const sendMessage = (p: Person) => {
    if (!messageDraft.trim()) return;
    toast.success(`Message sent to ${p.alias}`, {
      action: { label: "View in Profile", onClick: () => navigate("/profile") },
    });
    setMessagingOpen(false);
    setMessageDraft("");
  };

  const selectChapter = (id: string) => {
    setSelectedChapterId(id);
    setSelected(null);
    setShowPresence(false);
    setShowEntryHint(false);
    bump();
  };

  const exploreTribe = (id: string) => {
    setSelectedTribeId(id);
    setShowTribes(false);
    setSelected(null);
    setSelectedChapterId(null);
    setShowPresence(false);
  };

  const openEndScreen = () => {
    setSelected(null);
    setSelectedChapterId(null);
    setSelectedTribeId(null);
    setShowTribes(false);
    setShowPresence(false);
    setShowEndScreen(true);
  };

  const showNearestChapter = (t: Tribe) => {
    const list = CHAPTERS.filter((c) => c.tribe.id === t.id);
    if (!list.length) {
      setJustJoined(null);
      setSelectedTribeId(t.id);
      setShowTribes(false);
      return;
    }
    const best = you
      ? list.reduce((a, c) => (Math.hypot(c.lat - you.lat, c.lng - you.lng) < Math.hypot(a.lat - you.lat, a.lng - you.lng) ? c : a))
      : list.reduce((a, c) => (c.members.length > a.members.length ? c : a));
    setJustJoined(null);
    setSelectedTribeId(t.id);
    setShowTribes(false);
    selectChapter(best.id);
  };

  // Reveal sequence
  useEffect(() => {
    if (interactions >= 2) setLayer((l) => Math.max(l, 2)); // connections
    if (interactions >= 4) setLayer((l) => Math.max(l, 3)); // chapters
  }, [interactions]);

  // Opening Creators (the tribe behind the app) counts as "explored enough"
  // on its own, regardless of click count.
  useEffect(() => {
    if (selectedTribeId === "creators") setExploredCreators(true);
  }, [selectedTribeId]);

  // The wrap-up button lives in the nav, not on this page, so its eligibility
  // (glow or not) has to be pushed out — and the click that opens the end
  // screen comes back the same way. See tribeStore's WRAPUP_EVENT.
  useEffect(() => { setWrapUpEligible(wrapUpEligible); }, [wrapUpEligible]);
  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: string } | undefined;
      if (detail?.type === "open") openEndScreen();
    };
    window.addEventListener(WRAPUP_EVENT, onEvent);
    return () => window.removeEventListener(WRAPUP_EVENT, onEvent);
  }, []);

  // Clicking the light blooms a flash of light, then the map appears.
  const reduceMotion = useReducedMotion();
  const [bursting, setBursting] = useState(false);
  const enter = () => {
    if (bursting) return;
    if (reduceMotion) {
      setLayer(1);
      bump();
      return;
    }
    setBursting(true);
    window.setTimeout(() => {
      setLayer(1);
      bump();
    }, 900);
  };

  const running = layer >= 1;

  // ── Canvas render loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const t0 = performance.now();

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    // Pre-seed particle drift positions per node
    const drift = PEOPLE.map(() => ({
      ax: Math.random() * Math.PI * 2,
      ay: Math.random() * Math.PI * 2,
      sp: 0.0004 + Math.random() * 0.0008,
    }));
    // Dust particles
    const dust = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00005,
      vy: (Math.random() - 0.5) * 0.00003,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.4 + 0.1,
    }));

    const tick = (now: number) => {
      const s = liveRef.current;
      const t = (now - t0) / 1000;
      const { w, h } = sizeRef.current;
      const spot = s.selectedTribeId;
      ctx.clearRect(0, 0, w, h);

      // Dust drift
      ctx.globalCompositeOperation = "lighter";
      for (const d of dust) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x += 1; if (d.x > 1) d.x -= 1;
        if (d.y < 0) d.y += 1; if (d.y > 1) d.y -= 1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(180,200,255,${d.a * 0.25})`;
        ctx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Global pulse wave every ~12s
      const pulseT = (t % 12) / 12;
      if (pulseT < 0.6) {
        const pr = pulseT * Math.max(w, h) * 1.4;
        const alpha = (1 - pulseT / 0.6) * 0.06;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(160,200,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.arc(w / 2, h / 2, Math.max(0, pr), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Node positions (with micro-orbital motion); the overlay hit-tests against these
      const pos = PEOPLE.map((p, i) => {
        const base = placePerson(p, w, h);
        const d = drift[i];
        // Kept tiny so nobody wanders off the coast into the sea.
        const ox = Math.cos(d.ax + t * d.sp * 60) * 2;
        const oy = Math.sin(d.ay + t * d.sp * 50) * 1.5;
        return { x: base.x + ox, y: base.y + oy, p };
      });
      posRef.current = pos;
      const byId = new Map(pos.map((n) => [n.p.id, n]));

      // Curved bezier with slight underwater wobble
      const drawLink = (c: TribeLink, alpha: number, width: number, colorA: string, colorB: string) => {
        const a = byId.get(c.a.id)!;
        const b = byId.get(c.b.id)!;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const nx = -(b.y - a.y);
        const ny = (b.x - a.x);
        const nl = Math.hypot(nx, ny) || 1;
        const curve = 40 + 30 * Math.sin(t * 0.6 + c.s * 5);
        const cx = mx + (nx / nl) * curve;
        const cy = my + (ny / nl) * curve;

        ctx.beginPath();
        const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        g.addColorStop(0, hexA(colorA, alpha));
        g.addColorStop(1, hexA(colorB, alpha));
        ctx.strokeStyle = g;
        ctx.lineWidth = width;
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
      };

      ctx.globalCompositeOperation = "lighter";
      if (spot) {
        // Spotlight: only links inside the chosen tribe, tinted in its colour
        const tribe = TRIBES.find((x) => x.id === spot)!;
        for (const c of tribeLinks.get(tribe.id) ?? []) {
          const a = byId.get(c.a.id)!;
          const b = byId.get(c.b.id)!;
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + (a.x + b.y) * 0.005);
          drawLink(c, 0.35 + pulse * 0.2, 1.3, tribe.color, tribe.color);
        }
      } else if (s.showLines) {
        if (s.layer >= 2) {
          for (const c of CONNECTIONS) {
            const a = byId.get(c.a.id)!;
            const b = byId.get(c.b.id)!;
            const isHi =
              s.hovered === c.a.id || s.hovered === c.b.id ||
              s.selected === c.a.id || s.selected === c.b.id;
            const baseA = 0.06 + c.s * 0.10;
            const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + (a.x + b.y) * 0.005);
            const alpha = isHi ? Math.min(0.9, baseA + 0.3 + pulse * 0.15) : baseA + pulse * 0.04;
            drawLink(c, alpha, isHi ? 1.2 : 0.6, "#7dc8ff", "#b48cff");
          }
        }
        // Your tribe stays faintly threaded together once you've joined
        if (s.myTribeId) {
          const mine = TRIBES.find((x) => x.id === s.myTribeId)!;
          for (const c of tribeLinks.get(mine.id) ?? []) drawLink(c, 0.22, 0.9, mine.color, mine.color);
        }
      }

      // Chapters: tribe-coloured clouds where a tribe's members cluster
      if (s.layer >= 3 || spot) {
        ctx.globalCompositeOperation = "lighter";
        for (const ch of CHAPTERS) {
          if (!(s.layer >= 3 || ch.tribe.id === spot)) continue;
          const c = project(ch.lat, ch.lng, w, h);
          const breathe = 1 + 0.08 * Math.sin(t * 0.7 + ch.members.length + ch.lat);
          const R = chapterRadius(ch) * breathe;
          const dim = spot && ch.tribe.id !== spot ? 0.12 : 1;
          const boost = s.selectedChapterId === ch.id ? 1.8 : 1;
          ctx.globalAlpha = Math.min(1, dim * boost);
          const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
          grd.addColorStop(0, hexA(ch.tribe.color, 0.4));
          grd.addColorStop(0.5, hexA(ch.tribe.color, 0.14));
          grd.addColorStop(1, hexA(ch.tribe.color, 0));
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // Nodes — a chosen or previewed tribe reads as brighter dots against dimmed ones
      const focus = spot ?? s.previewTribeId;
      for (const n of pos) {
        const tribe = tribeOf.get(n.p.id)!;
        const color = tribe.color;
        const inSpotlight = !focus || tribe.id === focus;
        ctx.globalAlpha = inSpotlight ? 1 : 0.2;
        const breathe = 0.85 + 0.15 * Math.sin(t * 1.2 + n.x * 0.01);
        const isHi = s.hovered === n.p.id || s.selected === n.p.id;
        const lit = !!focus && inSpotlight;
        const boost = lit ? 1 : !focus && tribe.id === s.myTribeId ? 0.45 : 0;
        const auraR = (isHi ? 38 : lit ? 27 : 24) * breathe;

        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, auraR);
        grd.addColorStop(0, hexA(color, 0.55 + boost * 0.12));
        grd.addColorStop(0.4, hexA(color, 0.18 + boost * 0.06));
        grd.addColorStop(1, hexA(color, 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, auraR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(n.x, n.y, isHi ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Name the focused tribe on the map itself, above its biggest cluster
      if (focus) {
        const tribe = TRIBES.find((x) => x.id === focus);
        if (tribe) {
          const chapters = CHAPTERS.filter((c) => c.tribe.id === focus);
          const anchorChapter = chapters.reduce<Chapter | null>((a, c) => (!a || c.members.length > a.members.length ? c : a), null);
          const anchor = anchorChapter
            ? project(anchorChapter.lat, anchorChapter.lng, w, h)
            : (() => {
                const m = tribeMembers.get(focus)?.[0];
                return m ? placePerson(m, w, h) : null;
              })();
          if (anchor) {
            ctx.globalCompositeOperation = "source-over";
            ctx.font = "600 13px Barlow, sans-serif";
            ctx.textAlign = "center";
            ctx.shadowColor = "rgba(0,0,0,0.85)";
            ctx.shadowBlur = 8;
            ctx.fillStyle = hexA(tribe.color, 0.95);
            ctx.fillText(tribe.name, anchor.x, anchor.y - (anchorChapter ? Math.min(chapterRadius(anchorChapter) * 0.5, 44) : 22));
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
            ctx.textAlign = "start";
          }
        }
      }

      // You
      ctx.globalCompositeOperation = "source-over";
      if (s.you && s.youVisible) {
        const p = placeSpot(s.you.lat, s.you.lng, w, h);
        youPosRef.current = { x: p.x, y: p.y };
        const yc = TRIBES.find((x) => x.id === s.myTribeId)?.color ?? "#ffffff";
        const ph = (t % 3) / 3;
        ctx.beginPath();
        ctx.strokeStyle = hexA(yc, 0.5 * (1 - ph));
        ctx.lineWidth = 1;
        ctx.arc(p.x, p.y, 8 + ph * 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = hexA(yc, 0.95);
        ctx.lineWidth = 1.4;
        if (s.youAnonymous) ctx.setLineDash([3, 3]);
        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        youPosRef.current = null;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    r();
    const ro = new ResizeObserver(r);
    ro.observe(el);
    return () => ro.disconnect();
  }, [running]);

  // Hit-testing runs against the dots as drawn this frame (they drift), and picks
  // the nearest one, so crowded areas resolve to whichever dot is actually closest.
  const pickAt = (x: number, y: number): string | null => {
    let best: string | null = null;
    let bestD = 26;
    for (const n of posRef.current) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestD) { bestD = d; best = n.p.id; }
    }
    const yp = youPosRef.current;
    if (yp && Math.hypot(yp.x - x, yp.y - y) < bestD) best = "you";
    return best;
  };

  const pickChapterAt = (x: number, y: number): Chapter | null => {
    const { w, h } = sizeRef.current;
    let best: Chapter | null = null;
    let bestD = Infinity;
    for (const ch of CHAPTERS) {
      if (!(layer >= 3 || ch.tribe.id === selectedTribeId)) continue;
      const c = project(ch.lat, ch.lng, w, h);
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < chapterRadius(ch) && d < bestD) { bestD = d; best = ch; }
    }
    return best;
  };

  const selectedPerson = PEOPLE.find((p) => p.id === selected) || null;
  const hoveredPerson = PEOPLE.find((p) => p.id === hovered) || null;
  const activeChapter = CHAPTERS.find((c) => c.id === selectedChapterId) ?? null;
  const myTribe = myTribeId ? TRIBES.find((t) => t.id === myTribeId) ?? null : null;
  const activeTribe = selectedTribeId ? TRIBES.find((t) => t.id === selectedTribeId) ?? null : null;
  const previewTribe = previewTribeId ? TRIBES.find((t) => t.id === previewTribeId) ?? null : null;
  // Your own tribe leads the row once you've joined.
  const orderedTribes = myTribe ? [myTribe, ...TRIBES.filter((t) => t.id !== myTribe.id)] : TRIBES;
  const selectedPersonTribe = selectedPerson ? tribeOf.get(selectedPerson.id) ?? null : null;
  const suggestedTribeId =
    onboarding?.intention ? rankTribes(onboarding.intention, [])[0].tribe.id : null;
  const nearbySites = activeChapter
    ? SITES.filter((s) => !s.locked)
        .map((s) => ({ s, km: haversineKm(activeChapter.lat, activeChapter.lng, s.coords[1], s.coords[0]) }))
        .filter((x) => x.km <= 3500)
        .sort((a, b) => a.km - b.km)
        .slice(0, 2)
        .map((x) => x.s)
    : [];
  const briefLine = onboarding
    ? [onboarding.purposeLabel, onboarding.durationLabel, onboarding.site?.region].filter(Boolean).join(" · ")
    : "";

  const youName = presence.anonymous ? "Anonymous nomad" : user?.name ?? "You";
  const youWhere = you
    ? presence.cityOnly ? you.region : `${you.region} · ${you.lat.toFixed(2)}°, ${you.lng.toFixed(2)}°`
    : "";
  const introName = presence.anonymous ? "a fellow nomad" : user?.name ?? "a new nomad";

  const nextStepsProps = (t: Tribe) => ({
    tribe: t,
    userName: introName,
    intro: intros[t.id],
    onSendIntro: (text: string) => sendIntro(t, text),
    exchangeSent: exchangeRequests.map((r) => r.id),
    stayDays: onboarding?.stayDays ?? null,
    onRequestExchange: requestExchange,
    onNearestChapter: () => showNearestChapter(t),
  });

  // First-visit nudge: points at whichever light lands nearest center (varies
  // with viewport size) and is gone the moment anyone is actually clicked.
  const hintTarget = useMemo(() => {
    if (!size.w || !size.h || !landReady) return null;
    let best: Person | null = null;
    let bestDist = Infinity;
    for (const p of PEOPLE) {
      const { x, y } = placePerson(p, size.w, size.h);
      const dist = (x - size.w / 2) ** 2 + (y - size.h / 2) ** 2;
      if (dist < bestDist) { bestDist = dist; best = p; }
    }
    return best;
  }, [size, landReady]);

  const youPoint = you && landReady ? placeSpot(you.lat, you.lng, size.w, size.h) : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#02030a] text-white">
      {/* Atmospheric background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <img
          src={atlas}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms]"
          style={{
            filter: "blur(0.5px) saturate(0.85)",
            opacity: layer >= 1 ? 0.55 : 0,
          }}
        />

        {/* Animated ocean shimmer — masked to ocean areas only */}
        {layer >= 1 && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-[2000ms]"
            style={{
              WebkitMaskImage: `url(${oceanMask})`,
              maskImage: `url(${oceanMask})`,
              WebkitMaskSize: "cover",
              maskSize: "cover",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              ...({ WebkitMaskMode: "luminance", maskMode: "luminance" } as React.CSSProperties),
            }}
          >
            <div
              className="absolute inset-0 mix-blend-screen opacity-50"
              style={{
                background:
                  "radial-gradient(60% 40% at 20% 60%, rgba(60,160,210,0.32), transparent 70%), radial-gradient(50% 35% at 75% 40%, rgba(80,200,220,0.24), transparent 70%), radial-gradient(45% 30% at 50% 80%, rgba(40,120,200,0.28), transparent 70%)",
                animation: "oceanDrift 28s ease-in-out infinite",
              }}
            />
            <div
              className="absolute inset-0 mix-blend-screen opacity-35"
              style={{
                background:
                  "repeating-linear-gradient(115deg, rgba(150,215,255,0.10) 0px, rgba(150,215,255,0.10) 2px, transparent 2px, transparent 9px)",
                animation: "oceanShimmer 14s linear infinite",
              }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-[#02030a]/40 via-[#02030a]/55 to-[#02030a]/80" />
        {/* subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* Ocean animation keyframes */}
      <style>{`
        @keyframes oceanDrift {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(-2%, 1.5%, 0) scale(1.06); }
        }
        @keyframes oceanShimmer {
          0% { background-position: 0 0; }
          100% { background-position: 240px 80px; }
        }
      `}</style>

      {/* ── Layer 0: minimal entry ───────────────────────────────────────── */}
      <AnimatePresence>
        {layer === 0 && (
          <motion.button
            key="entry"
            type="button"
            onClick={enter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.4 }}
            className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-10 cursor-pointer"
          >
            <RevealLight bursting={bursting} reduce={!!reduceMotion} />
            <motion.div
              animate={{ opacity: bursting ? 0 : 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-10"
            >
              <BlurText
                text="You are not alone in motion."
                className="font-heading text-4xl md:text-5xl text-white/90 text-center"
              />
              <motion.p
                className="text-[13px] uppercase tracking-[0.25em] text-white/80 font-body text-center"
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                Click the light to meet the tribe
              </motion.p>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Layer 1+: Living world ───────────────────────────────────────── */}
      {layer >= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
          className="relative z-10 min-h-screen w-full"
        >
          {/* World container — fullscreen, scroll deepens layers */}
          <div
            ref={wrapRef}
            className="relative h-screen w-full"
            onWheel={(e) => { if (e.deltaY > 0) bump(); }}
            onClick={() => {
              bump();
              setSelected(null);
              setSelectedChapterId(null);
              setShowTribes(false);
              setShowPresence(false);
              setSelectedTribeId(null);
            }}
          >
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* One pointer surface over the canvas: picks the nearest dot (or chapter) under the cursor */}
            <div
              className="absolute inset-0"
              style={{ cursor: hovered ? "pointer" : "default" }}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const id = pickAt(e.clientX - r.left, e.clientY - r.top);
                setHovered((prev) => (prev === id ? prev : id));
              }}
              onMouseLeave={() => setHovered(null)}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - r.left;
                const y = e.clientY - r.top;
                const id = pickAt(x, y);
                if (id === "you") {
                  e.stopPropagation();
                  setSelected(null);
                  setShowTribes(false);
                  setShowPresence((v) => !v);
                  setShowEntryHint(false);
                  bump();
                  return;
                }
                if (id) { e.stopPropagation(); selectPerson(id); return; }
                const ch = pickChapterAt(x, y);
                if (ch) { e.stopPropagation(); selectChapter(ch.id); }
              }}
            />

            {/* Keyboard access to the lights */}
            <ul className="sr-only">
              {PEOPLE.map((p) => (
                <li key={p.id}>
                  <button
                    onFocus={() => setHovered(p.id)}
                    onBlur={() => setHovered((h) => (h === p.id ? null : h))}
                    onClick={(e) => { e.stopPropagation(); selectPerson(p.id); }}
                  >
                    {p.alias}, {p.city}, {tribeOf.get(p.id)?.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Your marker label */}
            {youPoint && presence.visible && (
              <div
                className="absolute pointer-events-none text-[9px] uppercase tracking-[0.16em] text-white/70 font-body"
                style={{ left: youPoint.x + 14, top: youPoint.y - 6 }}
              >
                You
              </div>
            )}

            {/* Header overlay */}
            <div className="absolute top-24 left-0 right-0 px-5 md:px-8 lg:px-16 pointer-events-none">
              <div className="max-w-[1400px] mx-auto flex items-start justify-between gap-6">
                <div>
                  <h1 className="font-heading text-white text-4xl md:text-5xl lg:text-6xl leading-[0.9] tracking-[-2px]">
                    Your people are already in motion.
                  </h1>
                  {arrival && selectedChapterId === arrivalChapterId && (
                    <p className="mt-4 inline-flex liquid-glass tag-glass">
                      Showing who's near {arrival.label ?? "there"}
                    </p>
                  )}
                  {!arrival && (
                    <p className="mt-4 text-sm text-white/80 font-body font-light max-w-[40ch] leading-snug">
                      Each light is a nomad. Each colour is a tribe — pick one below to see who belongs.
                    </p>
                  )}
                </div>

                {/* Find (or open) your tribe — the details expand out of the bottom bar */}
                <div className="relative pointer-events-auto shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(null);
                      setShowPresence(false);
                      setSelectedChapterId(null);
                      if (myTribe) {
                        exploreTribe(myTribe.id);
                      } else {
                        setSelectedTribeId(null);
                        setShowTribes((v) => !v);
                      }
                    }}
                    className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90 hover:text-white flex items-center gap-2 whitespace-nowrap"
                  >
                    {myTribe ? (
                      <>
                        <span
                          className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                          style={{ background: myTribe.color, boxShadow: `0 0 8px ${myTribe.color}` }}
                        />
                        {myTribe.name}
                      </>
                    ) : (
                      "Find your tribe"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* First-visit nudge — a ghost cursor taps the nearest-to-center
                light on a loop. Steps aside once any panel is in play. */}
            <AnimatePresence>
              {showEntryHint && hintTarget && !selectedPerson && !showTribes && !activeTribe && !activeChapter && !showPresence && (
                <motion.div
                  key="entry-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: placePerson(hintTarget, size.w, size.h).x,
                    top: placePerson(hintTarget, size.w, size.h).y,
                  }}
                >
                  <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    animate={{ scale: [1, 1, 0.72, 1], opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 2.4,
                      times: [0, 0.15, 0.6, 0.85],
                      repeat: Infinity,
                      repeatDelay: 1.2,
                      ease: "easeInOut",
                    }}
                  >
                    <MousePointer2
                      className="h-5 w-5 text-white"
                      style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
                      fill="white"
                      fillOpacity={0.15}
                      strokeWidth={1.75}
                    />
                  </motion.div>
                  <div
                    className="absolute pointer-events-auto"
                    style={{
                      left: Math.min(22, size.w - placePerson(hintTarget, size.w, size.h).x - 236),
                      top: -14,
                      width: 220,
                    }}
                  >
                    <div className="liquid-glass-strong rounded-xl pl-3.5 pr-2.5 py-2.5 flex items-start gap-2">
                      <p className="font-body text-[12px] text-white/90 leading-snug">
                        Click a light to meet someone — every light belongs to a tribe.
                      </p>
                      <button
                        onClick={() => setShowEntryHint(false)}
                        aria-label="Dismiss hint"
                        className="text-white/50 hover:text-white/90 shrink-0 mt-0.5"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hover thought-bubble */}
            <AnimatePresence>
              {hoveredPerson && !selectedPerson && (
                <motion.div
                  key={`hover-${hoveredPerson.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: placePerson(hoveredPerson, size.w, size.h).x + 18,
                    top:  placePerson(hoveredPerson, size.w, size.h).y - 14,
                  }}
                >
                  <div className="liquid-glass rounded-2xl px-3 py-2 text-xs">
                    <span className="font-heading text-sm text-white/90">{hoveredPerson.alias}</span>
                    <span className="text-white/40 ml-2">{hoveredPerson.city}</span>
                  </div>
                </motion.div>
              )}
              {hovered === "you" && youPoint && presence.visible && !selectedPerson && (
                <motion.div
                  key="hover-you"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute pointer-events-none"
                  style={{ left: youPoint.x + 18, top: youPoint.y - 14 }}
                >
                  <div className="liquid-glass rounded-2xl px-3 py-2 text-xs whitespace-nowrap">
                    <span className="font-heading text-sm text-white/90">{youName}</span>
                    <span className="text-white/40 ml-2">{youWhere}</span>
                    <span className="text-white/30 ml-2">· you</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected person card */}
            <AnimatePresence>
              {selectedPerson && (
                <motion.div
                  key={`sel-${selectedPerson.id}`}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute z-20"
                  style={{
                    left: Math.max(12, Math.min(size.w - 300, placePerson(selectedPerson, size.w, size.h).x + 24)),
                    top:  Math.max(90, Math.min(size.h - barH - 340, placePerson(selectedPerson, size.w, size.h).y - 10)),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="liquid-glass rounded-[1.25rem] p-5 w-[280px]">
                    <div className="flex items-center gap-3">
                      <PersonAvatar person={selectedPerson} size={60} glow />
                      <div className="min-w-0">
                        <div className="font-heading text-lg text-white/95 truncate">{selectedPerson.alias}</div>
                        <div className="text-xs text-white/55 truncate">{selectedPerson.city}</div>
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] text-white/45 font-body">
                      {selectedPerson.occupation}, {selectedPerson.age}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selectedPerson.tags.map((t) => {
                        const shared = !!selectedPersonTribe?.tags.includes(t);
                        return (
                          <span
                            key={t}
                            className="tag-glass border text-[10px]"
                            style={{ borderColor: shared && selectedPersonTribe ? `${selectedPersonTribe.color}88` : "rgba(255,255,255,0.1)" }}
                          >
                            {t}
                          </span>
                        );
                      })}
                    </div>

                    <div
                      className="mt-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px]"
                      style={{
                        borderColor: selectedPerson.openToExchange ? "rgba(126,224,200,0.35)" : "rgba(255,255,255,0.08)",
                        background: selectedPerson.openToExchange ? "rgba(126,224,200,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background: selectedPerson.openToExchange ? "#7ee0c8" : "rgba(255,255,255,0.3)",
                          boxShadow: selectedPerson.openToExchange ? "0 0 8px #7ee0c8" : "none",
                        }}
                      />
                      <span className={selectedPerson.openToExchange ? "text-white/85" : "text-white/45"}>
                        {selectedPerson.openToExchange ? "Open to dwelling exchange" : "Not exchanging right now"}
                      </span>
                    </div>

                    {messagingOpen ? (
                      <div className="mt-3">
                        <textarea
                          autoFocus
                          value={messageDraft}
                          onChange={(e) => setMessageDraft(e.target.value)}
                          maxLength={200}
                          rows={2}
                          placeholder={`Say hi to ${selectedPerson.alias}...`}
                          className="w-full resize-none rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-[11px] text-white/90 font-body focus:outline-none focus:border-white/30"
                        />
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <button
                            onClick={() => sendMessage(selectedPerson)}
                            disabled={!messageDraft.trim()}
                            className="flex-1 rounded-full bg-white text-black hover:bg-white/90 px-3 py-1.5 text-[11px] font-body font-medium transition-colors disabled:opacity-40"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => { setMessagingOpen(false); setMessageDraft(""); }}
                            className="text-[11px] text-white/45 hover:text-white/80 font-body px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setMessagingOpen(true)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-[11px] text-white/75 hover:text-white hover:border-white/30 font-body transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                        Send a message
                      </button>
                    )}

                    {selectedPersonTribe && (
                      <button
                        onClick={() => exploreTribe(selectedPersonTribe.id)}
                        className="w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2 mt-3 text-left transition-colors hover:brightness-125"
                        style={{ borderColor: `${selectedPersonTribe.color}66`, background: `${selectedPersonTribe.color}1a` }}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ background: selectedPersonTribe.color, boxShadow: `0 0 10px ${selectedPersonTribe.color}` }}
                          />
                          <span className="min-w-0">
                            <span className="block text-[9px] uppercase tracking-[0.16em] text-white/45 font-body">Member of</span>
                            <span className="block font-heading text-sm text-white/95 truncate">{selectedPersonTribe.name}</span>
                          </span>
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.12em] shrink-0" style={{ color: selectedPersonTribe.color }}>
                          {(tribeMembers.get(selectedPersonTribe.id)?.length ?? 0)} · Explore →
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom bar: tribes legend + context slot + presence */}
            <motion.div
              ref={barRef}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-5 left-3 right-3 md:left-5 md:right-5 z-20 max-w-[1240px]"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence>
                {showPresence && (
                  <motion.div
                    key="presence-panel"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="liquid-glass-strong rounded-[1.25rem] p-4 w-[min(300px,100%)] absolute right-0 bottom-full mb-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-body">Presence</p>
                    <p className="text-[11px] text-white/50 font-body mt-1">How the tribe sees you on the map.</p>

                    <div className="mt-3 space-y-2.5">
                      {([
                        ["visible",   "Visible to tribe",  "Show your light on the map"],
                        ["anonymous", "Anonymous mode",    "Hide your name and photo"],
                        ["cityOnly",  "City-level only",   "Hide exact coordinates"],
                        ["showLines", "Show connections",  "Draw lines between tribe-mates"],
                      ] as const).map(([key, label, hint]) => (
                        <label key={key} className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={presence[key]}
                            onChange={(e) => updatePresence({ [key]: e.target.checked })}
                            className="mt-0.5 accent-[#7ee0c8]"
                          />
                          <span>
                            <span className="block text-[12px] text-white/85 font-body">{label}</span>
                            <span className="block text-[10px] text-white/40 font-body">{hint}</span>
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2.5">
                      {!presence.anonymous && user ? (
                        <img src={AVATAR_IMAGES[user.avatar]} alt="" className="h-7 w-7 rounded-full object-cover border border-white/15" />
                      ) : (
                        <span className="h-7 w-7 rounded-full border border-dashed border-white/30 shrink-0" />
                      )}
                      {you ? (
                        <p className="text-[11px] text-white/55 font-body leading-snug min-w-0">
                          {presence.visible
                            ? <><span className="text-white/85">{youName}</span> · {youWhere}</>
                            : "Hidden from the map"}
                        </p>
                      ) : (
                        <p className="text-[11px] text-white/55 font-body leading-snug">
                          Choose a voyage to place your light on the map.{" "}
                          <Link to="/discover" className="text-white/85 underline underline-offset-2">Voyages</Link>
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="liquid-glass rounded-[1.25rem] px-4 md:px-5 py-3.5 bg-black/45">
               <div className="flex items-center justify-between gap-3">
                {/* Tribes legend */}
                <div className="flex items-center gap-3 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/65 font-body shrink-0">
                    Tribes
                  </p>
                  <div className="flex items-center gap-1.5 flex-nowrap lg:flex-wrap overflow-x-auto lg:overflow-visible min-w-0">
                    {orderedTribes.map((t) => {
                      const on = selectedTribeId === t.id;
                      // Creators is the real team behind the app — worth a nudge
                      // so people actually open it rather than skim past it as
                      // just another tag on the map. Wrapped in its own element
                      // (not the button itself) because the button falls back to
                      // .liquid-glass, which clips box-shadow via its own
                      // overflow:hidden — see the panel-glow-pulse note above.
                      const isCreators = t.id === "creators";
                      return (
                        <div key={t.id} className={`rounded-full shrink-0 ${isCreators && !on ? "panel-glow-pulse" : ""}`}>
                          <button
                            onMouseEnter={() => setPreviewTribeId(t.id)}
                            onMouseLeave={() => setPreviewTribeId((cur) => (cur === t.id ? null : cur))}
                            onFocus={() => setPreviewTribeId(t.id)}
                            onBlur={() => setPreviewTribeId((cur) => (cur === t.id ? null : cur))}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (on) setSelectedTribeId(null);
                              else exploreTribe(t.id);
                              bump();
                            }}
                            aria-pressed={on}
                            className={`flex items-center gap-2.5 rounded-full px-3.5 py-2 text-[13px] font-body font-medium whitespace-nowrap transition-colors ${
                              on ? "bg-white text-black" : "liquid-glass text-white/90 hover:text-white"
                            } ${selectedTribeId && !on ? "opacity-60" : ""}`}
                          >
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ background: t.color, boxShadow: on ? "none" : `0 0 10px ${t.color}` }}
                            />
                            <span>{t.name}{myTribeId === t.id ? " ✓" : ""}</span>
                            <span className={`text-[11px] tabular-nums ${on ? "text-black/50" : "text-white/55"}`}>
                              {tribeMembers.get(t.id)?.length ?? 0}
                            </span>
                            {isCreators ? (
                              <span
                                className="text-[9px] uppercase tracking-[0.12em] rounded-full px-1.5 py-0.5"
                                style={on ? { background: "rgba(0,0,0,0.1)", color: "rgba(0,0,0,0.7)" } : { background: `${t.color}33`, color: t.color }}
                              >
                                Meet us
                              </span>
                            ) : !myTribeId && suggestedTribeId === t.id && (
                              <span
                                className={`text-[9px] uppercase tracking-[0.12em] rounded-full px-1.5 py-0.5 ${
                                  on ? "bg-black/10 text-black/70" : "bg-white/15 text-white/90"
                                }`}
                              >
                                For you
                              </span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPresence((v) => !v);
                    setSelected(null);
                    setShowTribes(false);
                  }}
                  aria-expanded={showPresence}
                  className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white/90 hover:text-white flex items-center gap-2 shrink-0"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      background: presence.visible ? "#7ee0c8" : "rgba(255,255,255,0.3)",
                      boxShadow: presence.visible ? "0 0 8px #7ee0c8" : "none",
                    }}
                  />
                  Presence
                </button>
               </div>

                {/* Context slot: chapter → tribe summary → prompt */}
                <div className="mt-3 pt-3 border-t border-white/10 min-h-[46px]">
                  <AnimatePresence mode="wait">
                    {activeChapter ? (
                      <motion.div
                        key={`chapter-${activeChapter.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-body">Chapter</p>
                            <div className="font-heading text-lg text-white/95 leading-tight truncate">
                              {activeChapter.city}
                              <span className="text-white/45"> · {activeChapter.tribe.name}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => exploreTribe(activeChapter.tribe.id)}
                            className="text-[10px] uppercase tracking-[0.12em] shrink-0 mt-1 hover:underline"
                            style={{ color: activeChapter.tribe.color }}
                          >
                            Explore tribe →
                          </button>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {activeChapter.members.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => selectPerson(m.id)}
                              className="tag-glass border border-white/10 text-[10px] hover:bg-white/10"
                            >
                              {m.alias}
                            </button>
                          ))}
                        </div>
                        {nearbySites.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-body">Voyages nearby</span>
                            {nearbySites.map((s) => (
                              <button
                                key={s.title}
                                onClick={() => navigate("/discover", { state: { focusSite: s.title } })}
                                className="tag-glass border border-white/15 text-[10px] hover:bg-white/10"
                              >
                                {s.title} · {s.region} →
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ) : activeTribe ? (
                      <motion.div
                        key={`tribe-${activeTribe.id}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.3 }}
                        className="max-h-[52vh] overflow-y-auto pr-1"
                      >
                        <TribeCard
                          tribe={activeTribe}
                          isMine={myTribeId === activeTribe.id}
                          hasOtherTribe={!!myTribeId && myTribeId !== activeTribe.id}
                          onClose={() => setSelectedTribeId(null)}
                          onJoin={() => joinTribe(activeTribe)}
                          onHoverMember={setHovered}
                          onPickMember={selectPerson}
                          onPickChapter={selectChapter}
                          nextSteps={nextStepsProps(activeTribe)}
                        />
                      </motion.div>
                    ) : showTribes ? (
                      <motion.div
                        key="find-tribe"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.3 }}
                        className="max-h-[52vh] overflow-y-auto pr-1"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 font-body">Find your tribe</p>
                            {briefLine && (
                              <p className="mt-1 text-xs text-white/50 font-body">
                                Based on your brief: <span className="text-white/75">{briefLine}</span>
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setShowTribes(false)}
                            aria-label="Close"
                            className="text-white/50 hover:text-white shrink-0"
                          >
                            <X className="h-4 w-4" strokeWidth={1.5} />
                          </button>
                        </div>
                        <div className="mt-3 max-w-[520px]">
                          <TribeMatcher
                            startOpen
                            initialIntention={onboarding?.intention ?? null}
                            myTribeId={myTribeId}
                            onExplore={exploreTribe}
                            onJoin={joinTribe}
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="slot-empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[11px] text-white/40 font-body"
                      >
                        {previewTribe ? (
                          <>
                            <span style={{ color: previewTribe.color }}>{previewTribe.name}</span>
                            {" — "}{previewTribe.tagline} · {tribeMembers.get(previewTribe.id)?.length ?? 0} members. Click to explore.
                          </>
                        ) : (
                          "Hover a tribe to preview it, click to explore — or click any light to meet someone."
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Join-tribe welcome, with real next steps */}
            <AnimatePresence>
              {justJoined && (
                <motion.div
                  key="join-congrats"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                  onClick={() => setJustJoined(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="liquid-glass-strong rounded-[1.5rem] p-6 md:p-7 w-full max-w-md max-h-[88vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-body">Welcome</p>
                      <h2 className="font-heading text-2xl text-white/95 mt-2">
                        You're part of{" "}
                        <span style={{ color: justJoined.color }}>{justJoined.name}</span>.
                      </h2>
                      <p className="text-sm text-white/60 font-body mt-2">{justJoined.tagline}</p>
                      <div className="mt-4 flex items-center justify-center -space-x-2">
                        {(tribeMembers.get(justJoined.id) ?? []).slice(0, 5).map((m) => (
                          <PersonAvatar key={m.id} person={m} size={40} className="ring-2 ring-[#02030a]" />
                        ))}
                      </div>
                      <p className="text-[11px] text-white/40 font-body mt-2">
                        {tribeMembers.get(justJoined.id)?.length ?? 0} others already here
                      </p>
                    </div>

                    <div className="mt-5">
                      <TribeNextSteps {...nextStepsProps(justJoined)} />
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => setJustJoined(null)}
                        className="mt-5 rounded-full bg-white text-black hover:bg-white/90 px-6 py-3 text-sm font-body font-medium inline-flex items-center gap-2 transition-colors"
                      >
                        Continue exploring
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wrap-up — a soft, optional finish line reached only by
                clicking "Ready to wrap up?" above, never automatic. Start
                Over reuses the same full reset used everywhere else in the
                app (StartOverButton -> restartApp), so that logic stays in
                one place instead of being reimplemented here. */}
            <AnimatePresence>
              {showEndScreen && (
                <motion.div
                  key="wrap-up"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="relative liquid-glass-strong rounded-[1.5rem] p-8 w-full max-w-sm text-center"
                  >
                    <button
                      onClick={() => setShowEndScreen(false)}
                      aria-label="Keep exploring"
                      className="absolute top-4 right-4 text-white/50 hover:text-white/90"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} />
                    </button>

                    <div className="relative w-14 h-14 mx-auto rounded-full bg-emerald-400/10 border border-emerald-400/30 inline-flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                      <Sparkles className="relative h-7 w-7 text-emerald-300" strokeWidth={1.8} />
                    </div>

                    <p className="mt-5 text-[11px] uppercase tracking-[.2em] text-white/60 font-body">
                      Thank you for exploring
                    </p>
                    <h2 className="font-heading text-2xl text-white/95 mt-2 leading-tight">
                      You're part of the Nomadic Engine tribe now.
                    </h2>
                    <p className="text-sm text-white/55 font-body mt-2">
                      Come back anytime to meet more people, or start over from the beginning.
                    </p>

                    <div className="mt-6 flex flex-col items-center gap-2">
                      <StartOverButton className="w-full rounded-full bg-white text-black hover:bg-white/90 px-6 py-3 text-sm font-body font-medium inline-flex items-center justify-center gap-2 transition-colors" />
                      <button
                        onClick={() => setShowEndScreen(false)}
                        className="text-[12px] text-white/50 hover:text-white/85 font-body"
                      >
                        Keep exploring
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Components ───────────────────────────────────────────────────────────────

/**
 * The reveal screen's light: a warm glow with soft ripples and a ghost-cursor cue
 * that shows it can be clicked. On click a flash blooms out and the map opens.
 */
function RevealLight({ bursting, reduce }: { bursting: boolean; reduce: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative h-28 w-28 my-6 cursor-pointer"
      aria-hidden
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {!reduce && [0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: "rgba(255,214,150,0.5)" }}
          animate={{ scale: [1, 3.6], opacity: [0.4, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeOut", delay: i * 1.4 }}
        />
      ))}

      <motion.span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,230,180,0.9) 0%, rgba(255,200,140,0.2) 38%, rgba(255,255,255,0) 72%)",
          filter: "blur(0.4px)",
        }}
        animate={hover && !bursting ? { scale: 1.45, opacity: 1 } : { scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={hover && !bursting ? { duration: 0.35, ease: "easeOut" } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {!reduce && !bursting && !hover && (
        <>
          <motion.span
            className="absolute inset-2 rounded-full border-2 border-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.85, 0], scale: [1, 1, 1, 1.9] }}
            transition={{ duration: 3.6, times: [0, 0.58, 0.63, 1], repeat: Infinity, repeatDelay: 1.4, ease: "easeOut" }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ x: [130, 4, 4, 4], y: [100, 6, 6, 6], opacity: [0, 1, 1, 0], scale: [1, 1, 0.72, 1] }}
            transition={{ duration: 3.6, times: [0, 0.4, 0.65, 1], repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          >
            <MousePointer2
              className="h-9 w-9 text-white"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.7)) drop-shadow(0 0 10px rgba(255,255,255,0.45))" }}
              fill="white"
              fillOpacity={0.5}
              strokeWidth={1.75}
            />
          </motion.div>
        </>
      )}

      <motion.span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,244,220,0.95) 0%, rgba(255,214,150,0.35) 40%, rgba(255,255,255,0) 70%)",
        }}
        initial={{ opacity: 0 }}
        animate={bursting ? { opacity: [0, 0.95, 0], scale: [1, 4, 10] } : { opacity: 0 }}
        transition={{ duration: 0.95, ease: "easeOut" }}
      />
    </div>
  );
}

/** Local, offline avatar: a real photo when the person has one, otherwise
    a tribe-coloured orb with their initial. */
function PersonAvatar({ person, size, glow, className = "" }: { person: Person; size: number; glow?: boolean; className?: string }) {
  const color = tribeOf.get(person.id)?.color ?? "#ffffff";
  if (person.photo) {
    return (
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full border border-white/15 overflow-hidden shrink-0 select-none ${className}`}
        style={{ width: size, height: size, boxShadow: glow ? `0 0 18px ${hexA(color, 0.35)}` : undefined }}
      >
        <img src={person.photo} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full border border-white/15 font-heading text-white/95 shrink-0 select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `radial-gradient(circle at 30% 25%, ${hexA(color, 0.85)}, ${hexA(color, 0.28)} 70%, rgba(2,3,10,0.9))`,
        boxShadow: glow ? `0 0 18px ${hexA(color, 0.35)}` : undefined,
      }}
    >
      {person.alias.charAt(0)}
    </span>
  );
}

/** "Not sure where you fit?" — picks the tribe that best matches why you are here. */
function TribeMatcher({
  startOpen, initialIntention, myTribeId, onExplore, onJoin,
}: {
  startOpen?: boolean;
  initialIntention: Intention | null;
  myTribeId: string | null;
  onExplore: (id: string) => void;
  onJoin: (t: Tribe) => void;
}) {
  // Already told us in onboarding? Open with the match ready instead of a blank form.
  const [open, setOpen] = useState(!!startOpen || initialIntention !== null);
  const [intention, setIntention] = useState<Intention | null>(initialIntention);

  const top = useMemo(() => rankTribes(intention, [])[0], [intention]);
  const hasInput = intention !== null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-white/20 px-3 py-2.5 text-left text-[12px] text-white/70 hover:text-white hover:border-white/40 transition-colors font-body"
      >
        Not sure where you fit? <span className="text-white/90">Match me →</span>
      </button>
    );
  }

  const reasons = [
    intention && top.tribe.intentions.includes(intention) ? `you're here to ${intention}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.03] px-3 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 font-body">Match me</p>
        <button onClick={() => setOpen(false)} className="text-[10px] text-white/40 hover:text-white/80 font-body">Hide</button>
      </div>

      <p className="text-[11px] text-white/55 font-body mt-2">I'm here to…</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {INTENTIONS.map((i) => (
          <button
            key={i}
            onClick={() => setIntention((cur) => (cur === i ? null : i))}
            aria-pressed={intention === i}
            className={`rounded-full px-3 py-1 text-[11px] capitalize font-body font-medium transition-colors ${intention === i ? "bg-white text-black" : "liquid-glass text-white/90"}`}
          >
            {i}
          </button>
        ))}
      </div>

      {hasInput && (
        <div
          className="mt-3 rounded-xl border px-3 py-2.5"
          style={{ borderColor: `${top.tribe.color}66`, background: `${top.tribe.color}14` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: top.tribe.color, boxShadow: `0 0 8px ${top.tribe.color}` }} />
              <span className="font-heading text-sm text-white/95 truncate">{top.tribe.name}</span>
            </span>
            <span className="text-[11px] shrink-0" style={{ color: top.tribe.color }}>{Math.round(top.score * 100)}% match</span>
          </div>
          {reasons.length > 0 && (
            <p className="text-[11px] text-white/50 font-body mt-1">Because {reasons.join(" and ")}.</p>
          )}
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onExplore(top.tribe.id)}
              className="flex-1 liquid-glass rounded-full px-3 py-2 text-xs font-body font-medium text-white/90 hover:text-white"
            >
              Explore
            </button>
            {myTribeId === top.tribe.id ? (
              <span className="flex-1 text-center rounded-full px-3 py-2 text-xs font-body font-medium text-white/70">✓ Yours</span>
            ) : (
              <button
                onClick={() => onJoin(top.tribe)}
                className="flex-1 rounded-full bg-white text-black hover:bg-white/90 px-3 py-2 text-xs font-body font-medium transition-colors"
              >
                Join
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type NextStepsProps = {
  tribe: Tribe;
  userName: string;
  intro: string | undefined;
  onSendIntro: (text: string) => void;
  exchangeSent: string[];
  stayDays: number | null;
  onRequestExchange: (p: Person) => void;
  onNearestChapter: () => void;
};

/** What to do once you're in a tribe: say hello, request an exchange, find your chapter. */
function TribeNextSteps({ tribe, userName, intro, onSendIntro, exchangeSent, stayDays, onRequestExchange, onNearestChapter }: NextStepsProps) {
  const members = tribeMembers.get(tribe.id) ?? [];
  // Members whose stay is closest in length to yours come first — those are the
  // exchanges most likely to line up.
  const stayFit = (m: Person) => (stayDays ? Math.min(stayDays, m.stayDays) / Math.max(stayDays, m.stayDays) : 0);
  const openMembers = members
    .filter((m) => m.openToExchange)
    .sort((a, b) => stayFit(b) - stayFit(a))
    .slice(0, 3);
  const [writing, setWriting] = useState(false);
  const [draft, setDraft] = useState(`Hi, I'm ${userName} — glad to be here.`);
  const hasChapters = CHAPTERS.some((c) => c.tribe.id === tribe.id);

  return (
    <div className="space-y-2.5 text-left">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-body">Next steps</p>

      <div className="rounded-xl border border-white/10 px-3 py-2.5">
        <p className="text-[12px] text-white/85 font-body">Say hello</p>
        {intro ? (
          <p className="text-[11px] mt-1 font-body" style={{ color: tribe.color }}>
            ✓ Sent: <span className="text-white/60">“{intro}”</span>
          </p>
        ) : writing ? (
          <div className="mt-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={140}
              rows={2}
              className="w-full resize-none rounded-lg bg-white/5 border border-white/10 px-2.5 py-2 text-[12px] text-white/90 font-body focus:outline-none focus:border-white/30"
            />
            <button
              onClick={() => draft.trim() && onSendIntro(draft.trim())}
              disabled={!draft.trim()}
              className="mt-2 w-full rounded-full bg-white text-black hover:bg-white/90 px-4 py-2 text-xs font-body font-medium transition-colors disabled:opacity-40"
            >
              Send to {members.length} members
            </button>
          </div>
        ) : (
          <button
            onClick={() => setWriting(true)}
            className="mt-1 text-[11px] text-white/55 hover:text-white font-body"
          >
            Introduce yourself to {members.length} members →
          </button>
        )}
      </div>

      <div className="rounded-xl border border-white/10 px-3 py-2.5">
        <p className="text-[12px] text-white/85 font-body">Open to a dwelling exchange</p>
        <div className="mt-1.5 space-y-1">
          {openMembers.length === 0 && <p className="text-[11px] text-white/40 font-body">No one is exchanging right now.</p>}
          {openMembers.map((m) => {
            const sent = exchangeSent.includes(m.id);
            return (
              <div key={m.id} className="flex items-center gap-2">
                <PersonAvatar person={m} size={28} />
                <span className="min-w-0 flex-1 text-[11px] text-white/70 font-body truncate">
                  {m.alias} · {m.city}
                  <span className="text-white/35"> · {m.stayDays}d stay</span>
                </span>
                <button
                  onClick={() => onRequestExchange(m)}
                  disabled={sent}
                  className="text-[9px] uppercase tracking-[0.12em] rounded-full border border-white/15 px-2 py-1 text-white/60 hover:text-white disabled:cursor-default"
                  style={sent ? { color: tribe.color, borderColor: `${tribe.color}66` } : undefined}
                >
                  {sent ? "✓ Requested" : "Request"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNearestChapter}
        className="w-full rounded-xl border border-white/10 px-3 py-2.5 text-left text-[12px] text-white/85 font-body hover:bg-white/5 transition-colors"
      >
        {hasChapters ? "Find my nearest chapter →" : "See where members are →"}
      </button>
    </div>
  );
}

/** The tribe card that grows out of the bottom bar: who it is, who is in it, where, and what to do next. */
function TribeCard({
  tribe, isMine, hasOtherTribe, onClose, onJoin, onHoverMember, onPickMember, onPickChapter, nextSteps,
}: {
  tribe: Tribe;
  isMine: boolean;
  hasOtherTribe: boolean;
  onClose: () => void;
  onJoin: () => void;
  onHoverMember: (id: string | null) => void;
  onPickMember: (id: string) => void;
  onPickChapter: (id: string) => void;
  nextSteps: NextStepsProps;
}) {
  const members = tribeMembers.get(tribe.id) ?? [];
  const info = tribeInfo.get(tribe.id);
  const cities = [...new Set(info?.cities ?? [])];
  const chapters = CHAPTERS.filter((c) => c.tribe.id === tribe.id);
  const hasSide = chapters.length > 0 || isMine;

  return (
    <div className={`relative pt-7 grid gap-x-8 gap-y-5 ${hasSide ? "lg:grid-cols-[1.1fr_1.5fr_1fr]" : "lg:grid-cols-[1.1fr_1.5fr]"}`}>
      {/* Closes this tribe card back to the tribes legend — top-right,
          under where Presence sits in the row above this card, rather than
          a text link buried next to the Join button. */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-0 right-0 liquid-glass rounded-full w-7 h-7 inline-flex items-center justify-center text-white/70 hover:text-white"
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ background: tribe.color, boxShadow: `0 0 12px ${tribe.color}` }}
          />
          <h3 className="font-heading text-2xl text-white leading-tight">{tribe.name}</h3>
        </div>
        <p className="mt-1 text-sm text-white/65 font-body">{tribe.tagline}</p>

        {info && info.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {info.tags.map((tag) => (
              <span key={tag} className="liquid-glass tag-glass text-[10px]">{tag}</span>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-white/50 font-body leading-snug">
          {members.length} {members.length === 1 ? "member" : "members"}
          {cities.length > 0 && <> across {cities.length} {cities.length === 1 ? "city" : "cities"}: {cities.slice(0, 4).join(", ")}{cities.length > 4 ? ` +${cities.length - 4}` : ""}</>}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={onJoin}
            disabled={isMine}
            className={`rounded-full px-5 py-2.5 text-sm font-body font-medium transition-colors disabled:cursor-default ${
              isMine ? "liquid-glass text-white/90" : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {isMine ? "✓ Your tribe" : hasOtherTribe ? "Switch to this tribe" : "Join this tribe"}
          </button>
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 font-body">Members</p>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 max-h-[190px] overflow-y-auto pr-1">
          {members.length === 0 && (
            <p className="text-[11px] text-white/40 font-body py-2">No one here yet — be the first.</p>
          )}
          {members.map((m) => (
            <button
              key={m.id}
              onMouseEnter={() => onHoverMember(m.id)}
              onMouseLeave={() => onHoverMember(null)}
              onClick={() => onPickMember(m.id)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-white/5 transition-colors min-w-0"
            >
              <PersonAvatar person={m} size={36} />
              <span className="min-w-0">
                <span className="block font-heading text-[13px] text-white/90 truncate">{m.alias}</span>
                <span className="block text-[10px] text-white/40 font-body truncate">{m.occupation} · {m.city}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {hasSide && (
        <div className="min-w-0">
          {chapters.length > 0 && (
            <>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 font-body">Chapters</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onPickChapter(c.id)}
                    className="liquid-glass tag-glass text-[10px] hover:bg-white/10"
                  >
                    {c.city} · {c.members.length}
                  </button>
                ))}
              </div>
            </>
          )}
          {isMine && (
            <div className={chapters.length > 0 ? "mt-5" : ""}>
              <TribeNextSteps {...nextSteps} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── helpers ──
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
