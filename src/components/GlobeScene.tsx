import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";

export type GlobeHandle = {
  zoomOut: () => void;
};

type Props = {
  onSettle: (lat: number, lng: number) => void;
  beacon: { lat: number; lng: number } | null;
  locked: boolean;
};

const LAND_GREEN = "#86EFAC";
const LAND_GRAY = "#CBD5E1";

const GlobeScene = forwardRef<GlobeHandle, Props>(function GlobeScene(
  { onSettle, beacon, locked },
  ref,
) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [countries, setCountries] = useState<{ features: object[] }>({ features: [] });
  const interacted = useRef(false);
  const lockedRef = useRef(locked);
  lockedRef.current = locked;

  useImperativeHandle(ref, () => ({
    zoomOut: () => {
      globeRef.current?.pointOfView({ altitude: 2.5 }, 1000);
    },
  }));

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson",
    )
      .then((r) => r.json())
      .then((d) => setCountries(d as { features: object[] }))
      .catch(() => undefined);
  }, []);

  // Configure controls + detect motion settling
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      autoRotate: boolean;
      enableDamping: boolean;
      dampingFactor: number;
      dynamicDampingFactor: number;
      enableZoom: boolean;
      rotateSpeed: number;
      addEventListener: (t: string, cb: () => void) => void;
      removeEventListener: (t: string, cb: () => void) => void;
    };
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.dynamicDampingFactor = 0.12;
    controls.enableZoom = true;
    controls.rotateSpeed = 0.9;

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
          onSettle(pov.lat, pov.lng);
        }
      } else {
        stillMs = 0;
      }
    };
    raf = requestAnimationFrame(tick);

    const onDown = () => {
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

  }, [onSettle, size.w]);

  const ringsData = beacon ? [beacon] : [];
  const pointsData = beacon ? [beacon] : [];

  return (
    <Globe
      ref={globeRef as never}
      width={size.w}
      height={size.h}
      backgroundColor="rgba(0,0,0,0)"
      globeMaterial={
        new THREE.MeshPhongMaterial({
          color: new THREE.Color("#E0F2FE"),
          shininess: 0,
          specular: new THREE.Color("#0f172a"),
        })
      }
      showAtmosphere
      atmosphereColor="#6366F1"
      atmosphereAltitude={0.13}

      polygonsData={countries.features}
      polygonCapColor={(d) => {
        const id = JSON.stringify((d as { properties?: unknown }).properties ?? "").length;
        return id % 3 === 0 ? LAND_GREEN : LAND_GRAY;
      }}
      polygonSideColor={() => "rgba(203,213,225,0.35)"}
      polygonStrokeColor={() => "#E2E8F0"}
      polygonAltitude={0.006}
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
  );
});

export default GlobeScene;
