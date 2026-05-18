import { useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * TribeWorld — single-scene world-reveal experience.
 *
 * Phases (0..1 continuous, driven by progressRef):
 *   0.00–0.20  PURE PRESENCE      abstract drifting particles
 *   0.20–0.45  LIFE SIGNALS       particles cohere, faint pulse
 *   0.45–0.75  WORLD REVEAL       particles gravitate to lat/lng on sphere, earth fades in
 *   0.75–1.00  GLOBAL TRIBE       nodes + arcs + camp glows visible
 */

type Props = {
  progressRef: React.MutableRefObject<number>;
  onPick?: (id: string | null) => void;
  pickedRef: React.MutableRefObject<string | null>;
};

// Real cities — lat, lng
const TRIBE_NODES = [
  { id: "lisbon",    name: "Kestrel",  city: "Lisbon",      lat: 38.72, lng: -9.14,  intent: "create"      },
  { id: "tbilisi",   name: "Aria",     city: "Tbilisi",     lat: 41.71, lng: 44.78,  intent: "build"       },
  { id: "chiangmai", name: "Mira",     city: "Chiang Mai",  lat: 18.79, lng: 98.99,  intent: "explore"     },
  { id: "mexico",    name: "Ilya",     city: "Mexico City", lat: 19.43, lng: -99.13, intent: "collaborate" },
  { id: "marrakech", name: "Noor",     city: "Marrakech",   lat: 31.63, lng: -7.99,  intent: "create"      },
  { id: "bali",      name: "Reva",    city: "Ubud",         lat: -8.51, lng: 115.26, intent: "explore"     },
  { id: "berlin",    name: "Jonas",   city: "Berlin",       lat: 52.52, lng: 13.40,  intent: "build"       },
  { id: "cdmx",      name: "Sol",     city: "Oaxaca",       lat: 17.07, lng: -96.72, intent: "create"      },
  { id: "tokyo",     name: "Hiroto",  city: "Tokyo",        lat: 35.68, lng: 139.69, intent: "build"       },
  { id: "capetown",  name: "Thandi",  city: "Cape Town",    lat: -33.92, lng: 18.42, intent: "collaborate" },
  { id: "medellin",  name: "Mateo",   city: "Medellín",     lat: 6.24, lng: -75.58,  intent: "explore"     },
  { id: "istanbul",  name: "Elif",    city: "Istanbul",     lat: 41.01, lng: 28.97,  intent: "create"      },
];

const INTENT_COLOR: Record<string, THREE.Color> = {
  create:      new THREE.Color("#ffd49b"),
  build:       new THREE.Color("#9bd1ff"),
  explore:     new THREE.Color("#b69bff"),
  collaborate: new THREE.Color("#9bffc4"),
};

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

// ---------- Particle field that morphs to Earth ----------
function MorphingParticles({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const COUNT = 6000;
  const ref = useRef<THREE.Points>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const { abstractPos, earthPos, seeds } = useMemo(() => {
    const a = new Float32Array(COUNT * 3);
    const e = new Float32Array(COUNT * 3);
    const s = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // Abstract: random cloud
      const r = 2.2 + Math.random() * 1.6;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      a[i * 3 + 0] = r * Math.sin(p) * Math.cos(t);
      a[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.7;
      a[i * 3 + 2] = r * Math.cos(p);
      // Earth target: uniform-ish on sphere, biased to continents via mask noise (simple)
      const lat = (Math.random() * 180 - 90);
      const lng = (Math.random() * 360 - 180);
      const v = latLngToVec3(lat, lng, RADIUS * 1.003);
      e[i * 3 + 0] = v.x; e[i * 3 + 1] = v.y; e[i * 3 + 2] = v.z;
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
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      // smoothstep into reveal window 0.20..0.70
      const p = progressRef.current;
      const morph = THREE.MathUtils.smoothstep(p, 0.20, 0.70);
      matRef.current.uniforms.uMorph.value += (morph - matRef.current.uniforms.uMorph.value) * 0.06;
      matRef.current.uniforms.uReveal.value += (p - matRef.current.uniforms.uReveal.value) * 0.06;
    }
  });

  return (
    <points ref={ref} geometry={geom} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime:   { value: 0 },
          uMorph:  { value: 0 },
          uReveal: { value: 0 },
        }}
        vertexShader={/* glsl */`
          attribute vec3 aAbstract;
          attribute vec3 aEarth;
          attribute float aSeed;
          uniform float uTime;
          uniform float uMorph;
          varying float vAlpha;
          varying float vSeed;

          // tiny hash noise
          float hash(float n){ return fract(sin(n)*43758.5453); }

          void main() {
            vSeed = aSeed;
            // drifting noise on abstract
            float t = uTime * 0.15 + aSeed * 6.2831;
            vec3 drift = vec3(sin(t*1.1), cos(t*0.9), sin(t*0.7)) * 0.25 * (1.0 - uMorph);
            vec3 abs_p = aAbstract + drift;
            vec3 pos = mix(abs_p, aEarth, uMorph);

            vec4 mv = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = mix(2.0, 1.4, uMorph) * (1.0 + 0.4 * sin(uTime*0.8 + aSeed*10.0));
            gl_PointSize = size * (260.0 / -mv.z);
            vAlpha = mix(0.55, 0.85, uMorph);
          }
        `}
        fragmentShader={/* glsl */`
          varying float vAlpha;
          varying float vSeed;
          uniform float uReveal;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float a = smoothstep(0.5, 0.0, d);
            vec3 cool = vec3(0.75, 0.85, 1.0);
            vec3 warm = vec3(1.0, 0.92, 0.78);
            vec3 c = mix(cool, warm, vSeed * 0.7 + uReveal * 0.2);
            gl_FragColor = vec4(c, a * vAlpha);
          }
        `}
      />
    </points>
  );
}

// ---------- Earth shader (procedural soft continents) ----------
function Earth({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame((_, dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt;
      const p = progressRef.current;
      const op = THREE.MathUtils.smoothstep(p, 0.45, 0.75);
      matRef.current.uniforms.uOpacity.value += (op - matRef.current.uniforms.uOpacity.value) * 0.06;
    }
  });
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 96, 96]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        uniforms={{
          uTime:    { value: 0 },
          uOpacity: { value: 0 },
        }}
        vertexShader={/* glsl */`
          varying vec3 vNormal;
          varying vec3 vPos;
          void main(){
            vNormal = normalize(normalMatrix * normal);
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={/* glsl */`
          varying vec3 vNormal;
          varying vec3 vPos;
          uniform float uTime;
          uniform float uOpacity;

          // 3D noise
          vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
          vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
          vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
          vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
          float snoise(vec3 v){
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0,0.5,1.0,2.0);
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
                      i.z + vec4(0.0, i1.z, i2.z, 1.0))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
            m = m*m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
          }

          void main(){
            vec3 n = normalize(vPos);
            float c1 = snoise(n * 1.6);
            float c2 = snoise(n * 3.1 + 5.0);
            float land = smoothstep(0.05, 0.35, c1 * 0.7 + c2 * 0.3);

            vec3 ocean = vec3(0.05, 0.10, 0.22);
            vec3 landC = vec3(0.20, 0.28, 0.35);
            vec3 col = mix(ocean, landC, land);

            // rim
            float rim = pow(1.0 - max(dot(vNormal, vec3(0.0,0.0,1.0)), 0.0), 2.2);
            col += vec3(0.4, 0.6, 1.0) * rim * 0.45;

            // subtle latitude lines
            float lat = abs(sin(asin(n.y) * 10.0));
            col += vec3(0.06) * smoothstep(0.95, 1.0, 1.0 - lat) * 0.0; // off

            gl_FragColor = vec4(col, uOpacity * 0.95);
          }
        `}
      />
    </mesh>
  );
}

// ---------- Atmosphere halo ----------
function Atmosphere({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  useFrame(() => {
    if (matRef.current) {
      const op = THREE.MathUtils.smoothstep(progressRef.current, 0.50, 0.80);
      matRef.current.uniforms.uOpacity.value += (op - matRef.current.uniforms.uOpacity.value) * 0.06;
    }
  });
  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        uniforms={{ uOpacity: { value: 0 } }}
        vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`
          varying vec3 vN; uniform float uOpacity;
          void main(){
            float f = pow(0.85 - dot(vN, vec3(0.0,0.0,1.0)), 2.2);
            gl_FragColor = vec4(vec3(0.45, 0.65, 1.0) * f, f * uOpacity);
          }
        `}
      />
    </mesh>
  );
}

// ---------- Tribe nodes ----------
function TribeNodes({
  progressRef, onPick, pickedRef,
}: {
  progressRef: React.MutableRefObject<number>;
  onPick?: (id: string | null) => void;
  pickedRef: React.MutableRefObject<string | null>;
}) {
  const group = useRef<THREE.Group>(null!);
  const positions = useMemo(
    () => TRIBE_NODES.map((n) => latLngToVec3(n.lat, n.lng, RADIUS * 1.015)),
    []
  );
  useFrame((s) => {
    const p = progressRef.current;
    const reveal = THREE.MathUtils.smoothstep(p, 0.65, 0.95);
    if (group.current) {
      group.current.children.forEach((c, i) => {
        const child = c as THREE.Mesh;
        const target = reveal;
        child.scale.setScalar(target * (1 + 0.15 * Math.sin(s.clock.elapsedTime * 1.6 + i)));
        (child.material as THREE.MeshBasicMaterial).opacity = target;
      });
    }
  });

  return (
    <group ref={group}>
      {TRIBE_NODES.map((n, i) => {
        const v = positions[i];
        const color = INTENT_COLOR[n.intent] ?? new THREE.Color("#ffffff");
        return (
          <mesh
            key={n.id}
            position={v}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = "default"; }}
            onClick={(e) => { e.stopPropagation(); onPick?.(n.id); pickedRef.current = n.id; }}
          >
            <sphereGeometry args={[0.018, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ---------- Arc connections ----------
function Arcs({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null!);

  const arcs = useMemo(() => {
    const pairs: { a: typeof TRIBE_NODES[number]; b: typeof TRIBE_NODES[number] }[] = [];
    // hand-picked alignments by intent
    const byIntent: Record<string, typeof TRIBE_NODES> = {};
    TRIBE_NODES.forEach((n) => {
      (byIntent[n.intent] ||= [] as any).push(n);
    });
    Object.values(byIntent).forEach((list) => {
      for (let i = 0; i < list.length - 1; i++) pairs.push({ a: list[i], b: list[i + 1] });
    });

    return pairs.map(({ a, b }) => {
      const va = latLngToVec3(a.lat, a.lng, RADIUS * 1.01);
      const vb = latLngToVec3(b.lat, b.lng, RADIUS * 1.01);
      const mid = va.clone().add(vb).multiplyScalar(0.5);
      const lift = 1 + va.distanceTo(vb) * 0.55;
      mid.normalize().multiplyScalar(RADIUS * lift);
      const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
      const pts = curve.getPoints(48);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const color = INTENT_COLOR[a.intent] ?? new THREE.Color("#fff");
      return { g, color };
    });
  }, []);

  useFrame(() => {
    const reveal = THREE.MathUtils.smoothstep(progressRef.current, 0.72, 0.98);
    if (group.current) {
      group.current.children.forEach((c) => {
        const line = c as THREE.Line;
        const m = line.material as THREE.LineBasicMaterial;
        m.opacity = reveal * 0.55;
      });
    }
  });

  return (
    <group ref={group}>
      {arcs.map((a, i) => (
        <line key={i}>
          <primitive object={a.g} attach="geometry" />
          <lineBasicMaterial
            color={a.color}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </line>
      ))}
    </group>
  );
}

// ---------- Camera staging ----------
function Stager({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 6));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((s, dt) => {
    const p = progressRef.current;
    // pull camera in as the world resolves
    const z = THREE.MathUtils.lerp(6.2, 3.4, THREE.MathUtils.smoothstep(p, 0.0, 0.9));
    // slow orbit, more controlled at end
    const orbit = (1 - p) * 0.6;
    const t = s.clock.elapsedTime;
    targetPos.current.set(
      Math.sin(t * 0.05) * orbit,
      Math.cos(t * 0.04) * orbit * 0.5,
      z
    );
    camera.position.lerp(targetPos.current, 0.04);
    camera.lookAt(targetLook.current);
  });

  return null;
}

// ---------- Whole scene ----------
export default function TribeWorld({ progressRef, onPick, pickedRef }: Props) {
  useEffect(() => () => { document.body.style.cursor = "default"; }, []);
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, 1.75]}
      onPointerMissed={() => { onPick?.(null); pickedRef.current = null; }}
    >
      <color attach="background" args={["#01030f"]} />
      <fog attach="fog" args={["#01030f", 5, 12]} />
      <ambientLight intensity={0.4} />
      <Stager progressRef={progressRef} />
      <Atmosphere progressRef={progressRef} />
      <Earth progressRef={progressRef} />
      <MorphingParticles progressRef={progressRef} />
      <TribeNodes progressRef={progressRef} onPick={onPick} pickedRef={pickedRef} />
      <Arcs progressRef={progressRef} />
    </Canvas>
  );
}

export { TRIBE_NODES };
