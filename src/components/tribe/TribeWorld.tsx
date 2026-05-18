import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * TribeWorld — single-scene world-reveal experience.
 *
 * Driven by progressRef (0..1) — usually scroll-bound.
 *   0.00–0.15  PURE PRESENCE     central tribe core + drifting particles
 *   0.15–0.35  LIFE SIGNALS      floating identity orbs appear (abstract positions)
 *   0.35–0.55  RELATIONSHIPS     glowing threads between aligned orbs (still abstract)
 *   0.55–0.80  WORLD REVEAL      particles + orbs gravitate to lat/lng on Earth; globe fades in
 *   0.80–1.00  LIVING WORLD MAP  arcs anchor to geography, camp halos pulse on cities
 */

export type TribeNode = {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  intent: "create" | "build" | "explore" | "collaborate";
  emotion: "curious" | "focused" | "building" | "moving";
  stayDays: number;
  signal: string;
};

export const TRIBE_NODES: TribeNode[] = [
  { id: "lisbon",    name: "Kestrel", city: "Lisbon",      lat: 38.72, lng: -9.14,  intent: "create",      emotion: "focused",  stayDays: 12, signal: "I write where the salt is." },
  { id: "tbilisi",   name: "Aria",    city: "Tbilisi",     lat: 41.71, lng: 44.78,  intent: "build",       emotion: "building", stayDays: 21, signal: "I ship between mountains." },
  { id: "chiangmai", name: "Mira",    city: "Chiang Mai",  lat: 18.79, lng: 98.99,  intent: "explore",     emotion: "curious",  stayDays: 40, signal: "I film the monsoon." },
  { id: "mexico",    name: "Ilya",    city: "Mexico City", lat: 19.43, lng: -99.13, intent: "collaborate", emotion: "moving",   stayDays:  8, signal: "Sound, in transit." },
  { id: "marrakech", name: "Noor",    city: "Marrakech",   lat: 31.63, lng: -7.99,  intent: "create",      emotion: "focused",  stayDays:  5, signal: "Weaving slow afternoons." },
  { id: "bali",      name: "Reva",    city: "Ubud",        lat: -8.51, lng: 115.26, intent: "explore",     emotion: "curious",  stayDays: 30, signal: "Studying water." },
  { id: "berlin",    name: "Jonas",   city: "Berlin",      lat: 52.52, lng: 13.40,  intent: "build",       emotion: "building", stayDays: 60, signal: "Quiet code at dawn." },
  { id: "oaxaca",    name: "Sol",     city: "Oaxaca",      lat: 17.07, lng: -96.72, intent: "create",      emotion: "focused",  stayDays: 14, signal: "Color first, words later." },
  { id: "tokyo",     name: "Hiroto",  city: "Tokyo",       lat: 35.68, lng: 139.69, intent: "build",       emotion: "focused",  stayDays: 18, signal: "Small tools, large care." },
  { id: "capetown",  name: "Thandi",  city: "Cape Town",   lat: -33.92, lng: 18.42, intent: "collaborate", emotion: "moving",   stayDays: 10, signal: "Convening from the cape." },
  { id: "medellin",  name: "Mateo",   city: "Medellín",    lat: 6.24, lng: -75.58,  intent: "explore",     emotion: "curious",  stayDays: 25, signal: "Listening to cities." },
  { id: "istanbul",  name: "Elif",    city: "Istanbul",    lat: 41.01, lng: 28.97,  intent: "create",      emotion: "building", stayDays: 22, signal: "Two continents, one studio." },
];

export const INTENT_COLOR_HEX: Record<TribeNode["intent"], string> = {
  create:      "#ffd49b",
  build:       "#9bd1ff",
  explore:     "#b69bff",
  collaborate: "#9bffc4",
};
const INTENT_COLOR: Record<string, THREE.Color> = Object.fromEntries(
  Object.entries(INTENT_COLOR_HEX).map(([k, v]) => [k, new THREE.Color(v)])
);

const CAMPS = [
  { id: "salt-page",    name: "Salt & Page",    lat: 38.72, lng: -9.14,  members: 14, theme: "Writers by the Atlantic" },
  { id: "quiet-signal", name: "Quiet Signal",   lat: 41.71, lng: 44.78,  members:  9, theme: "Builders in the Caucasus" },
  { id: "monsoon",      name: "Monsoon Studio", lat: 18.79, lng: 98.99,  members: 22, theme: "Filmmakers in SE Asia" },
];

const RADIUS = 1.4;

function latLngToVec3(lat: number, lng: number, r = RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

/* ---------- shared world group + drag orbit ---------- */
function WorldGroup({
  progressRef,
  dragRef,
  children,
}: {
  progressRef: React.MutableRefObject<number>;
  dragRef: React.MutableRefObject<{ x: number; y: number; vx: number; vy: number }>;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const d = dragRef.current;
    // idle slow drift, slower as world resolves
    const idle = 0.04 * (1 - 0.5 * progressRef.current);
    d.x += d.vx * dt + idle * dt;
    d.y += d.vy * dt;
    d.vx *= 0.92;
    d.vy *= 0.92;
    // clamp pitch
    d.y = Math.max(-0.9, Math.min(0.9, d.y));
    ref.current.rotation.y = d.x;
    ref.current.rotation.x = d.y * 0.7;
  });
  return <group ref={ref}>{children}</group>;
}

/* ---------- central tribe core (Phase 1) ---------- */
function TribeCore({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame((_, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
    // visible at start, fades as Earth emerges
    const op = 1 - THREE.MathUtils.smoothstep(progressRef.current, 0.45, 0.70);
    matRef.current.uniforms.uOpacity.value += (op - matRef.current.uniforms.uOpacity.value) * 0.06;
  });
  return (
    <mesh>
      <sphereGeometry args={[0.35, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 1 } }}
        vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          varying vec3 vN; uniform float uTime; uniform float uOpacity;
          void main(){
            float f = pow(1.0 - max(dot(vN, vec3(0.0,0.0,1.0)), 0.0), 2.0);
            float pulse = 0.7 + 0.3 * sin(uTime * 1.2);
            vec3 col = mix(vec3(1.0, 0.92, 0.78), vec3(0.6, 0.8, 1.0), 0.5 + 0.5 * sin(uTime*0.3));
            gl_FragColor = vec4(col * f * pulse, f * uOpacity);
          }
        `}
      />
    </mesh>
  );
}

/* ---------- abstract drifting particles morphing to Earth ---------- */
function MorphingParticles({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const COUNT = 5500;
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { abstractPos, earthPos, seeds } = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    const e = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 2.0 + Math.random() * 1.8;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      a[i * 3]     = r * Math.sin(p) * Math.cos(t);
      a[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.7;
      a[i * 3 + 2] = r * Math.cos(p);
      const lat = (Math.random() * 180 - 90);
      const lng = (Math.random() * 360 - 180);
      const v = latLngToVec3(lat, lng, RADIUS * 1.005);
      e[i * 3]     = v.x; e[i * 3 + 1] = v.y; e[i * 3 + 2] = v.z;
      s[i] = Math.random();
    }
    return { abstractPos: a, earthPos: e, seeds: s };
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("aAbstract", new THREE.BufferAttribute(abstractPos, 3));
    g.setAttribute("aEarth",    new THREE.BufferAttribute(earthPos, 3));
    g.setAttribute("aSeed",     new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("position",  new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    return g;
  }, [abstractPos, earthPos, seeds]);

  useFrame((_, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
    const morph = THREE.MathUtils.smoothstep(progressRef.current, 0.45, 0.78);
    matRef.current.uniforms.uMorph.value += (morph - matRef.current.uniforms.uMorph.value) * 0.05;
  });

  return (
    <points geometry={geom} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{ uTime: { value: 0 }, uMorph: { value: 0 } }}
        vertexShader={`
          attribute vec3 aAbstract; attribute vec3 aEarth; attribute float aSeed;
          uniform float uTime; uniform float uMorph;
          varying float vAlpha; varying float vSeed;
          void main(){
            vSeed = aSeed;
            float t = uTime * 0.15 + aSeed * 6.2831;
            vec3 drift = vec3(sin(t*1.1), cos(t*0.9), sin(t*0.7)) * 0.25 * (1.0 - uMorph);
            vec3 pos = mix(aAbstract + drift, aEarth, uMorph);
            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = mix(1.8, 1.2, uMorph) * (1.0 + 0.4 * sin(uTime*0.8 + aSeed*10.0));
            gl_PointSize = size * (260.0 / -mv.z);
            vAlpha = mix(0.45, 0.75, uMorph);
          }
        `}
        fragmentShader={`
          varying float vAlpha; varying float vSeed;
          void main(){
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float a = smoothstep(0.5, 0.0, d);
            vec3 cool = vec3(0.75, 0.85, 1.0);
            vec3 warm = vec3(1.0, 0.92, 0.78);
            vec3 c = mix(cool, warm, vSeed * 0.7);
            gl_FragColor = vec4(c, a * vAlpha);
          }
        `}
      />
    </points>
  );
}

/* ---------- Earth shader ---------- */
function Earth({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame((_, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
    const op = THREE.MathUtils.smoothstep(progressRef.current, 0.55, 0.80);
    matRef.current.uniforms.uOpacity.value += (op - matRef.current.uniforms.uOpacity.value) * 0.06;
  });
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 96, 96]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={{ uTime: { value: 0 }, uOpacity: { value: 0 } }}
        vertexShader={`
          varying vec3 vN; varying vec3 vP;
          void main(){ vN = normalize(normalMatrix * normal); vP = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
        `}
        fragmentShader={`
          varying vec3 vN; varying vec3 vP; uniform float uTime; uniform float uOpacity;
          vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
          vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
          vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
          vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
          float snoise(vec3 v){
            const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0,0.5,1.0,2.0);
            vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0+1.0; vec4 s1 = floor(b1)*2.0+1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0); m = m*m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
          }
          void main(){
            vec3 n = normalize(vP);
            float c1 = snoise(n * 1.6);
            float c2 = snoise(n * 3.1 + 5.0);
            float land = smoothstep(0.05, 0.35, c1 * 0.7 + c2 * 0.3);
            vec3 ocean = vec3(0.05, 0.10, 0.22);
            vec3 landC = vec3(0.20, 0.28, 0.35);
            vec3 col = mix(ocean, landC, land);
            float rim = pow(1.0 - max(dot(vN, vec3(0.0,0.0,1.0)), 0.0), 2.2);
            col += vec3(0.4, 0.6, 1.0) * rim * 0.45;
            gl_FragColor = vec4(col, uOpacity * 0.95);
          }
        `}
      />
    </mesh>
  );
}

/* ---------- atmosphere halo ---------- */
function Atmosphere({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame(() => {
    if (!matRef.current) return;
    const op = THREE.MathUtils.smoothstep(progressRef.current, 0.60, 0.85);
    matRef.current.uniforms.uOpacity.value += (op - matRef.current.uniforms.uOpacity.value) * 0.06;
  });
  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending}
        uniforms={{ uOpacity: { value: 0 } }}
        vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`varying vec3 vN; uniform float uOpacity;
          void main(){ float f = pow(0.85 - dot(vN, vec3(0.0,0.0,1.0)), 2.2);
            gl_FragColor = vec4(vec3(0.45, 0.65, 1.0) * f, f * uOpacity); }`}
      />
    </mesh>
  );
}

/* ---------- tribe nodes (abstract orbit → earth lat/lng) ---------- */
function TribeNodes({
  progressRef, onPick, onHover, alignRef,
}: {
  progressRef: React.MutableRefObject<number>;
  onPick: (id: string | null, screen?: { x: number; y: number }) => void;
  onHover: (id: string | null) => void;
  alignRef: React.MutableRefObject<boolean>;
}) {
  const earthPositions = useMemo(
    () => TRIBE_NODES.map((n) => latLngToVec3(n.lat, n.lng, RADIUS * 1.018)),
    []
  );
  // Abstract starting positions — wide orbit around the core
  const abstractPositions = useMemo(
    () => TRIBE_NODES.map((_, i) => {
      const a = (i / TRIBE_NODES.length) * Math.PI * 2;
      const r = 1.6 + (i % 3) * 0.35;
      const y = ((i % 5) - 2) * 0.25;
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    }),
    []
  );

  const group = useRef<THREE.Group>(null!);
  const { camera, size } = useThree();
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((s) => {
    if (!group.current) return;
    const p = progressRef.current;
    const orbitMix   = 1 - THREE.MathUtils.smoothstep(p, 0.15, 0.30); // visible from p>0.15
    const appear     = THREE.MathUtils.smoothstep(p, 0.15, 0.30);
    const settleMix  = THREE.MathUtils.smoothstep(p, 0.50, 0.80);

    group.current.children.forEach((c, i) => {
      const child = c as THREE.Mesh;
      const node = TRIBE_NODES[i];
      // abstract motion: slow orbit + bob
      const t = s.clock.elapsedTime;
      const ab = abstractPositions[i].clone();
      const ang = t * 0.05 + i;
      const orbit = new THREE.Vector3(
        ab.x * Math.cos(ang * 0.3) - ab.z * Math.sin(ang * 0.3),
        ab.y + Math.sin(t * 0.4 + i) * 0.08,
        ab.x * Math.sin(ang * 0.3) + ab.z * Math.cos(ang * 0.3),
      );
      const earth = earthPositions[i];
      // align mode: pull "create" intent nodes toward each other slightly
      let pull = new THREE.Vector3();
      if (alignRef.current && p > 0.85 && node.intent === "create") {
        pull.set(Math.sin(t * 0.6) * 0.04, Math.cos(t * 0.5) * 0.03, 0);
      }
      const pos = orbit.multiplyScalar(orbitMix).add(earth.clone().multiplyScalar(1 - orbitMix)).add(pull);
      // before phase 2 (p<0.15) hide
      child.position.copy(pos);
      const scale = appear * (1 + 0.18 * Math.sin(t * 1.6 + i));
      child.scale.setScalar(scale);
      const mat = child.material as THREE.MeshBasicMaterial;
      mat.opacity = appear;
    });
  });

  const handleClick = (e: any, n: TribeNode) => {
    e.stopPropagation();
    // project world position to screen for radial menu
    const world = (e.object as THREE.Object3D).getWorldPosition(tmp).clone();
    world.project(camera);
    const x = (world.x *  0.5 + 0.5) * size.width;
    const y = (-world.y * 0.5 + 0.5) * size.height;
    onPick(n.id, { x, y });
  };

  return (
    <group ref={group}>
      {TRIBE_NODES.map((n) => {
        const color = INTENT_COLOR[n.intent];
        return (
          <mesh
            key={n.id}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; onHover(n.id); }}
            onPointerOut={() => { document.body.style.cursor = "default"; onHover(null); }}
            onClick={(e) => handleClick(e, n)}
          >
            <sphereGeometry args={[0.028, 20, 20]} />
            <meshBasicMaterial color={color} transparent opacity={0} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- relationship arcs (abstract straight lines → earth arcs) ---------- */
function Arcs({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const earthPos = useMemo(
    () => TRIBE_NODES.map((n) => latLngToVec3(n.lat, n.lng, RADIUS * 1.012)),
    []
  );
  const abstractPos = useMemo(
    () => TRIBE_NODES.map((_, i) => {
      const a = (i / TRIBE_NODES.length) * Math.PI * 2;
      const r = 1.6 + (i % 3) * 0.35;
      const y = ((i % 5) - 2) * 0.25;
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
    }),
    []
  );

  const pairs = useMemo(() => {
    const byIntent: Record<string, number[]> = {};
    TRIBE_NODES.forEach((n, i) => { (byIntent[n.intent] ||= []).push(i); });
    const out: { a: number; b: number; color: THREE.Color }[] = [];
    Object.entries(byIntent).forEach(([intent, list]) => {
      for (let i = 0; i < list.length - 1; i++)
        out.push({ a: list[i], b: list[i + 1], color: INTENT_COLOR[intent] });
    });
    return out;
  }, []);

  const SEG = 48;
  const group = useRef<THREE.Group>(null!);
  const geoms = useMemo(
    () => pairs.map(() => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
      return g;
    }),
    [pairs]
  );

  useFrame(() => {
    const p = progressRef.current;
    const visible = THREE.MathUtils.smoothstep(p, 0.32, 0.55); // pre-earth network
    const morph   = THREE.MathUtils.smoothstep(p, 0.55, 0.85); // straight → arc-on-earth
    const lateBoost = THREE.MathUtils.smoothstep(p, 0.78, 1.0);
    const overallOp = Math.max(visible * 0.5, lateBoost * 0.6);

    pairs.forEach((pair, idx) => {
      const a0 = abstractPos[pair.a], b0 = abstractPos[pair.b];
      const a1 = earthPos[pair.a],    b1 = earthPos[pair.b];
      const A = a0.clone().lerp(a1, morph);
      const B = b0.clone().lerp(b1, morph);
      // mid lifted outward (for earth arc) blended with simple straight midpoint
      const midStraight = A.clone().add(B).multiplyScalar(0.5);
      const midArc = A.clone().add(B).multiplyScalar(0.5);
      const lift = 1 + A.distanceTo(B) * 0.5;
      midArc.normalize().multiplyScalar(RADIUS * lift);
      const mid = midStraight.lerp(midArc, morph);
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      const pts = curve.getPoints(SEG - 1);
      const arr = (geoms[idx].attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < SEG; i++) {
        arr[i*3]     = pts[i].x;
        arr[i*3 + 1] = pts[i].y;
        arr[i*3 + 2] = pts[i].z;
      }
      (geoms[idx].attributes.position as THREE.BufferAttribute).needsUpdate = true;
    });

    if (group.current) {
      group.current.children.forEach((c) => {
        const m = (c as THREE.Line).material as THREE.LineBasicMaterial;
        m.opacity = overallOp;
      });
    }
  });

  return (
    <group ref={group}>
      {pairs.map((pair, i) => (
        <line key={i}>
          <primitive object={geoms[i]} attach="geometry" />
          <lineBasicMaterial color={pair.color} transparent opacity={0}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </line>
      ))}
    </group>
  );
}

/* ---------- camp glow halos on Earth ---------- */
function CampHalos({ progressRef, alignRef }: {
  progressRef: React.MutableRefObject<number>;
  alignRef: React.MutableRefObject<boolean>;
}) {
  const positions = useMemo(
    () => CAMPS.map((c) => latLngToVec3(c.lat, c.lng, RADIUS * 1.005)),
    []
  );
  const group = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (!group.current) return;
    const p = progressRef.current;
    const op = THREE.MathUtils.smoothstep(p, 0.80, 0.98);
    group.current.children.forEach((c, i) => {
      const mesh = c as THREE.Mesh;
      const t = s.clock.elapsedTime;
      const pulse = 0.85 + 0.25 * Math.sin(t * 1.2 + i);
      const boost = alignRef.current ? 1.35 : 1.0;
      mesh.scale.setScalar(pulse * boost);
      const m = mesh.material as THREE.MeshBasicMaterial;
      m.opacity = op * 0.6 * boost;
      // face camera-ish
      mesh.lookAt(0, 0, 0);
    });
  });
  return (
    <group ref={group}>
      {CAMPS.map((c, i) => (
        <mesh key={c.id} position={positions[i]}>
          <ringGeometry args={[0.04, 0.13, 48]} />
          <meshBasicMaterial color={"#b69bff"} transparent opacity={0} side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- camera staging ---------- */
function Stager({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const tgt = useRef(new THREE.Vector3(0, 0, 6));
  useFrame(() => {
    const p = progressRef.current;
    const z = THREE.MathUtils.lerp(6.4, 3.5, THREE.MathUtils.smoothstep(p, 0.0, 0.9));
    tgt.current.set(0, 0, z);
    camera.position.lerp(tgt.current, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/* ---------- drag listener (outside Canvas via DOM) ---------- */
function useDrag(targetRef: React.RefObject<HTMLElement>) {
  const dragRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    let down = false; let lx = 0; let ly = 0;
    const onDown = (e: PointerEvent) => { down = true; lx = e.clientX; ly = e.clientY; };
    const onUp   = () => { down = false; };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = (e.clientX - lx) / 300;
      const dy = (e.clientY - ly) / 400;
      dragRef.current.vx += dx;
      dragRef.current.vy += dy;
      lx = e.clientX; ly = e.clientY;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
    };
  }, [targetRef]);
  return dragRef;
}

/* ---------- main ---------- */
type Props = {
  progressRef: React.MutableRefObject<number>;
  alignRef: React.MutableRefObject<boolean>;
  containerRef: React.RefObject<HTMLElement>;
  onPick: (id: string | null, screen?: { x: number; y: number }) => void;
  onHover: (id: string | null) => void;
};

export default function TribeWorld({ progressRef, alignRef, containerRef, onPick, onHover }: Props) {
  const dragRef = useDrag(containerRef);
  useEffect(() => () => { document.body.style.cursor = "default"; }, []);
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6.4], fov: 50 }}
      dpr={[1, 1.75]}
      onPointerMissed={() => onPick(null)}
    >
      <color attach="background" args={["#01030f"]} />
      <fog attach="fog" args={["#01030f", 5, 12]} />
      <ambientLight intensity={0.4} />
      <Stager progressRef={progressRef} />
      <WorldGroup progressRef={progressRef} dragRef={dragRef}>
        <Atmosphere progressRef={progressRef} />
        <Earth progressRef={progressRef} />
        <MorphingParticles progressRef={progressRef} />
        <TribeCore progressRef={progressRef} />
        <Arcs progressRef={progressRef} />
        <CampHalos progressRef={progressRef} alignRef={alignRef} />
        <TribeNodes
          progressRef={progressRef}
          alignRef={alignRef}
          onPick={onPick}
          onHover={onHover}
        />
      </WorldGroup>
    </Canvas>
  );
}
