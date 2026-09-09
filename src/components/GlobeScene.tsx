import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

export type GlobeHandle = {
  zoomOut: () => void;
  surprise: () => void;
};

type Props = {
  onSettle: (lat: number, lng: number) => void;
  beacon: { lat: number; lng: number } | null;
  locked: boolean;
};

const LAND_SPOTS: Array<[number, number]> = [
  [48.85, 2.35],
  [35.68, 139.69],
  [-33.87, 151.21],
  [40.71, -74.01],
  [-22.91, -43.17],
  [19.08, 72.88],
  [30.04, 31.24],
  [-1.29, 36.82],
  [55.75, 37.62],
  [41.9, 12.5],
  [37.77, -122.42],
  [-34.6, -58.38],
  [13.75, 100.5],
  [64.15, -21.94],
  [-26.2, 28.05],
  [39.9, 116.4],
  [59.33, 18.07],
  [21.03, 105.85],
  [-12.05, -77.04],
  [45.42, -75.7],
  [28.61, 77.21],
  [-41.29, 174.78],
  [52.52, 13.4],
  [6.52, 3.38],
  [33.59, -7.62],
  [25.28, 55.3],
  [-16.5, -68.15],
  [43.65, -79.38],
  [1.35, 103.82],
  [-6.2, 106.85],
];

const GlobeScene = forwardRef<GlobeHandle, Props>(function GlobeScene(
  { onSettle, beacon, locked },
  ref,
) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const interacted = useRef(false);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const settleRef = useRef(onSettle);
  settleRef.current = onSettle;

  useImperativeHandle(ref, () => ({
    zoomOut: () => {
      globeRef.current?.pointOfView({ altitude: 1.8 }, 1000);
    },
    surprise: () => {
      const g = globeRef.current;
      if (!g) return;
      const pick = LAND_SPOTS[Math.floor(Math.random() * LAND_SPOTS.length)]!;
      const jitterLat = pick[0] + (Math.random() - 0.5) * 1.2;
      const jitterLng = pick[1] + (Math.random() - 0.5) * 1.2;
      interacted.current = false;
      g.pointOfView({ altitude: 1.8 }, 500);
      window.setTimeout(() => {
        globeRef.current?.pointOfView(
          { lat: jitterLat, lng: jitterLng, altitude: 1.2 },
          1600,
        );
      }, 450);
      window.setTimeout(() => settleRef.current(jitterLat, jitterLng), 2100);
    },
  }));

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Freeze globe interaction while the drawer is open
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
      const c = g.controls() as unknown as { enableRotate: boolean; enableZoom: boolean };
      c.enableRotate = false;
      c.enableZoom = false;
  }, [locked, size.w]);

  // Configure controls + detect motion settling
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      autoRotate: boolean;
      enableRotate: boolean;
      enableDamping: boolean;
      dampingFactor: number;
      dynamicDampingFactor: number;
      enableZoom: boolean;
      rotateSpeed: number;
    };
    controls.autoRotate = true;
    (controls as { autoRotateSpeed?: number }).autoRotateSpeed = 0.28;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.dynamicDampingFactor = 0.12;
    controls.enableZoom = false;
    controls.rotateSpeed = 0.9;
    controls.enableRotate = false;

    let last = g.pointOfView();
    let lastT = performance.now();
    let stillMs = 0;
    let movingMs = 0;
    let raf = 0;
    let pointerDown = false;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const gg = globeRef.current;
      if (!gg) return;
      const now = performance.now();
      const dt = Math.max(now - lastT, 1);
      lastT = now;
      const pov = gg.pointOfView();
      const d = Math.abs(pov.lat - last.lat) + Math.abs(pov.lng - last.lng);
      last = pov;
      if (lockedRef.current) return;
      const degPerSec = (d / dt) * 1000;
      if (!interacted.current || pointerDown) return;
      if (degPerSec > 4) movingMs += dt;
      if (degPerSec < 3.5) {
        stillMs += dt;
        if (stillMs > 350 || movingMs > 9000) {
          interacted.current = false;
          stillMs = 0;
          movingMs = 0;
          gg.pointOfView({ lat: pov.lat, lng: pov.lng, altitude: 1.2 }, 900);
          settleRef.current(pov.lat, pov.lng);
        }
      } else {
        stillMs = 0;
      }
    };
    raf = requestAnimationFrame(tick);

    const onDown = () => {
      if (lockedRef.current) return;
      pointerDown = true;
      interacted.current = true;
      stillMs = 0;
      movingMs = 0;
    };
    const onUp = () => {
      pointerDown = false;
      stillMs = 0;
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [size.w]);

  const ringsData = beacon ? [beacon] : [];
  const pointsData = beacon ? [beacon] : [];

  return (
    <div className="pointer-events-none h-full w-full">
      <Globe
        ref={globeRef as never}
        width={size.w}
        height={size.h}
        onGlobeReady={() => globeRef.current?.pointOfView({ altitude: 1.8 }, 0)}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-day.jpg"
        showAtmosphere
        atmosphereColor="#6366F1"
        atmosphereAltitude={0.13}
        pointsData={pointsData}
        pointLat={(d) => (d as { lat: number }).lat}
        pointLng={(d) => (d as { lng: number }).lng}
        pointColor={() => "#6366F1"}
        pointAltitude={0.03}
        pointRadius={0.35}
        ringsData={ringsData}
        ringLat={(d) => (d as { lat: number }).lat}
        ringLng={(d) => (d as { lng: number }).lng}
        ringColor={() => (t: number) => `rgba(99,102,241,${1 - t})`}
        ringMaxRadius={6}
        ringPropagationSpeed={3}
        ringRepeatPeriod={700}
      />
    </div>
  );
});

export default GlobeScene;
