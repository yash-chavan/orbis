import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Suspense, lazy, useCallback, useRef, useState } from "react";
import { Compass } from "lucide-react";
import InfoDrawer from "@/components/InfoDrawer";
import type { GlobeHandle } from "@/components/GlobeScene";
import { Button } from "@/components/ui/button";
import { getFacts, type Facts } from "@/lib/facts.functions";
import { loadSpot, type SpotData } from "@/lib/orbis";

const GlobeScene = lazy(() => import("@/components/GlobeScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Orbis — Discover a Random Destination" },
      {
        name: "description",
        content:
          "Tap once to discover a random destination with live weather, surprising local facts, food and slang.",
      },
      { property: "og:title", content: "Orbis — Discover a Random Destination" },
      {
        property: "og:description",
        content:
          "Tap once to land somewhere unexpected, then unlock live weather and wildly fun local facts.",
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--primary)_14%,transparent),transparent_62%)]" />

      <div className="absolute inset-0">
        <ClientOnly fallback={<GlobeFallback />}>
          <Suspense fallback={<GlobeFallback />}>
            <GlobeScene ref={globeRef} onSettle={handleSettle} beacon={beacon} />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="viewport-vignette pointer-events-none absolute inset-0 z-[5]" />

      {/* Centered title & tagline */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-5 pt-7 text-center sm:pt-10">
        <div className="rounded-3xl border border-glass bg-header-glass px-7 py-[18px] shadow-glass backdrop-blur-glass sm:px-9">
          <h1 className="text-2xl font-bold leading-none text-foreground sm:text-3xl">Orbis</h1>
          <p className="mt-1.5 max-w-md text-xs font-normal leading-relaxed text-muted-foreground sm:text-sm">
            Earth is weird. Let&rsquo;s explore it.
          </p>
        </div>
      </header>

      {/* Floating primary CTA */}
      {!open && !loading && (
        <div className="absolute inset-x-0 bottom-8 z-40 flex justify-center px-6 sm:bottom-10">
          <Button
            onClick={surpriseMe}
            size="lg"
            className="h-14 rounded-full border border-primary/60 px-8 text-base font-semibold shadow-glow transition duration-300 hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-[0.98] sm:px-10"
          >
            <Compass className="size-5 drop-shadow-sm" aria-hidden="true" />
            Find a Destination
          </Button>
        </div>
      )}

      {/* Center target indicator */}
      <div className="pointer-events-none fixed inset-0 z-10 grid place-items-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="target-sonar absolute inset-0 rounded-full" aria-hidden="true" />
          <span className="absolute h-6 w-6 rounded-full bg-black/60 blur-md" aria-hidden="true" />
          <span className="shadow-target relative h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
        </div>
      </div>

      {loading && !open && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 rounded-full border border-glass bg-card px-4 py-2 text-xs text-muted-foreground shadow-glass backdrop-blur-glass">
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
