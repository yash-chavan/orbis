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

  const spinAgain = () => {
    setOpen(false);
    setBeacon(null);
    globeRef.current?.zoomOut();
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

      {/* Header pill */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center p-3 sm:p-5">
        <div className="flex w-full max-w-3xl items-center justify-between gap-3 rounded-full border border-border bg-card/80 px-4 py-2.5 shadow-glass backdrop-blur-md">
          <h1 className="text-base font-semibold text-foreground sm:text-lg">Orbis 🌍</h1>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary sm:text-xs">
            👆 Drag &amp; flick the globe to discover
          </span>
        </div>
      </header>

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
