import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, lazy, useCallback, useRef, useState } from "react";
import InfoDrawer from "@/components/InfoDrawer";
import type { GlobeHandle } from "@/components/GlobeScene";
import { getFacts, type Facts } from "@/lib/facts.functions";
import { loadSpot, type SpotData } from "@/lib/orbis";

const GlobeScene = lazy(() => import("@/components/GlobeScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbis — Flick the Globe, Discover the Planet" },
      {
        name: "description",
        content:
          "Spin an interactive 3D globe, drop a pin anywhere on Earth and get live weather, bizarre local facts, street food and slang.",
      },
      { property: "og:title", content: "Orbis — Flick the Globe, Discover the Planet" },
      {
        property: "og:description",
        content:
          "Drag and flick a 3D Earth to land on a random spot, then unlock live weather and wildly fun local facts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [spot, setSpot] = useState<SpotData | null>(null);
  const [facts, setFacts] = useState<Facts | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [beacon, setBeacon] = useState<{ lat: number; lng: number } | null>(null);
  const globeRef = useRef<GlobeHandle>(null);
  const fetchFacts = useServerFn(getFacts);
  const reqId = useRef(0);

  const handleSettle = useCallback(
    async (lat: number, lng: number) => {
      const id = ++reqId.current;
      setBeacon({ lat, lng });
      setFacts(null);
      setLoading(true);
      const s = await loadSpot(lat, lng);
      if (id !== reqId.current) return;
      setSpot(s);
      setOpen(true);
      try {
        const res = await fetchFacts({
          data: {
            city: s.city,
            country: s.country,
            temperature: s.temperature,
            weatherCondition: s.weatherCondition,
            localTime: s.localTime,
            isWilderness: s.mode === "wilderness",
            isOcean: s.mode === "ocean",
          },
        });
        if (id !== reqId.current) return;
        setFacts(res.facts);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [fetchFacts],
  );

  const resetView = () => {
    reqId.current++;
    setOpen(false);
    setBeacon(null);
    setFacts(null);
    setSpot(null);
    setLoading(false);
    globeRef.current?.zoomOut();
  };

  const spinAgain = () => {
    resetView();
  };

  const surpriseMe = () => {
    resetView();
    globeRef.current?.surprise();
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_65%)]" />

      <div className="absolute inset-0">
        <ClientOnly fallback={<GlobeFallback />}>
          <Suspense fallback={<GlobeFallback />}>
            <GlobeScene ref={globeRef} onSettle={handleSettle} beacon={beacon} locked={open} />
          </Suspense>
        </ClientOnly>
      </div>

      {/* Centered title & tagline */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-col items-center px-6 pt-10 text-center sm:pt-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Orbis</h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground sm:text-lg">
          Earth is weird. Let&rsquo;s explore it.
        </p>
      </header>

      {/* Floating primary CTA */}
      <div className="absolute inset-x-0 bottom-8 z-40 flex justify-center px-6">
        <button
          onClick={surpriseMe}
          className="rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95 sm:px-10 sm:text-lg"
        >
          Find a Destination
        </button>
      </div>

      {/* Reticle */}
      <div className="pointer-events-none fixed inset-0 z-10 grid place-items-center">
        <div className="reticle-pulse relative h-24 w-24">
          <div className="absolute inset-0 rounded-full border border-primary/40" />
          <div className="absolute inset-6 rounded-full border border-primary/25" />
          <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
          <div className="absolute top-1/2 left-0 h-px w-4 bg-primary/50" />
          <div className="absolute top-1/2 right-0 h-px w-4 bg-primary/50" />
          <div className="absolute top-0 left-1/2 h-4 w-px bg-primary/50" />
          <div className="absolute bottom-0 left-1/2 h-4 w-px bg-primary/50" />
        </div>
      </div>

      {loading && !open && (
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full border border-border bg-card/80 px-4 py-2 text-xs text-muted-foreground backdrop-blur-md">
          Locking coordinates…
        </div>
      )}

      <InfoDrawer
        open={open}
        spot={spot}
        facts={facts}
        loading={loading}
        onSpinAgain={spinAgain}
      />
    </main>
  );
}

function GlobeFallback() {
  return (
    <div className="grid h-full w-full place-items-center">
      <div className="h-64 w-64 animate-pulse rounded-full bg-ocean" />
    </div>
  );
}
