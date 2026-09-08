import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Facts } from "@/lib/facts.functions";
import { fmtCoord, flagUrl, titleFor, weatherInfo, type SpotData } from "@/lib/orbis";

type Props = {
  open: boolean;
  spot: SpotData | null;
  facts: Facts | null;
  loading: boolean;
  onSpinAgain: () => void;
};

const MODE_STYLES = {
  city: {
    ring: "ring-primary/25",
    chip: "bg-primary/10 text-primary",
    glow: "from-primary/15",
    label: "City Mode",
  },
  wilderness: {
    ring: "ring-secondary/30",
    chip: "bg-secondary/12 text-secondary",
    glow: "from-secondary/15",
    label: "Wilderness Mode",
  },
  ocean: {
    ring: "ring-azure/35",
    chip: "bg-azure/12 text-azure",
    glow: "from-azure/15",
    label: "Deep Sea Mode",
  },
} as const;

function Shimmer({ text }: { text: string }) {
  return <span className="shimmer-text">{text}</span>;
}

export default function InfoDrawer({ open, spot, facts, loading, onSpinAgain }: Props) {
  const [index, setIndex] = useState(0);
  const [fahrenheit, setFahrenheit] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setIndex(0);
      setSwiped(false);
    }
  }, [open, spot?.lat, spot?.lng]);

  const goTo = (i: number) => {
    const el = trackRef.current;
    const clamped = Math.max(0, Math.min(2, i));
    if (!el) return;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
    setSwiped(true);
  };

  const style = MODE_STYLES[spot?.mode ?? "city"];
  const temp = spot ? (fahrenheit ? spot.temperature * 1.8 + 32 : spot.temperature) : 0;
  const wx = weatherInfo(spot?.weatherCode ?? 0);
  const flag = flagUrl(spot?.countryCode ?? null);

  return (
    <AnimatePresence>
      {open && spot && (
        <motion.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6 sm:pb-6"
        >
          <div
            className={`mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card/80 shadow-glass ring-1 backdrop-blur-md ${style.ring}`}
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${style.chip}`}
              >
                {style.label}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {fmtCoord(spot.lat, spot.lng)}
              </span>
            </div>

            <div className="relative">
              <div
                ref={trackRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const next = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
                  setIndex(next);
                  if (next !== 0) setSwiped(true);
                }}
                className="mt-3 flex snap-x snap-mandatory items-stretch overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {/* Card 1 */}
                <section className="flex min-h-[290px] w-full shrink-0 snap-center flex-col px-10 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">The Vibe Check</p>
                    <AnimatePresence>
                      {!swiped && (
                        <motion.span
                          initial={{ opacity: 0, x: 6 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 6 }}
                          className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                        >
                          Swipe left ➔
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    {flag ? (
                      <img
                        src={flag}
                        alt={`${spot.country ?? "Country"} flag`}
                        className="h-7 w-10 rounded-sm border border-border object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{spot.mode === "ocean" ? "🌊" : "🧭"}</span>
                    )}
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-foreground">
                        {titleFor(spot)}
                      </h2>
                      <p className="truncate text-xs text-muted-foreground">
                        {spot.country ?? "International waters"} · {spot.biome}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/12 px-3 py-1.5 text-sm font-semibold text-secondary">
                      {temp.toFixed(1)}°{fahrenheit ? "F" : "C"}
                    </span>
                    <div className="inline-flex items-center rounded-full border border-border bg-muted/60 p-0.5">
                      {(["C", "F"] as const).map((u) => {
                        const active = (u === "F") === fahrenheit;
                        return (
                          <button
                            key={u}
                            onClick={() => setFahrenheit(u === "F")}
                            aria-pressed={active}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            °{u}
                          </button>
                        );
                      })}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground">
                      {wx.icon} {wx.label}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground">
                      🕒 {spot.localTime} local
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-foreground">
                    {loading ? <Shimmer text="Scanning local vibes…" /> : facts?.vibeSummary}
                  </p>
                </section>

                {/* Card 2 */}
                <section className="flex min-h-[290px] w-full shrink-0 snap-center flex-col px-10 pb-4">
                  <p className="text-xs font-medium text-muted-foreground">Mind-Blower</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-lg shadow-glow">
                      💡
                    </span>
                    <h2 className="text-xl font-semibold text-foreground">Did You Know?</h2>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground">
                    {loading ? <Shimmer text="Scanning local vibes…" /> : facts?.bizarreFact}
                  </p>
                </section>

                {/* Card 3 */}
                <section className="flex min-h-[290px] w-full shrink-0 snap-center flex-col px-10 pb-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {spot.mode === "city" ? "Culture & Palate" : "Wild Explorer"}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {spot.mode === "city" ? "Eat this, say that" : "Survive & speak"}
                  </h2>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-border bg-background/70 p-3">
                      <span className="text-[11px] font-semibold tracking-wide text-secondary uppercase">
                        🍜 Must try
                      </span>
                      <p className="mt-1 text-sm text-foreground">
                        {loading ? <Shimmer text="Scanning local vibes…" /> : facts?.localFood}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/70 p-3">
                      <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                        🗣️ Local lingo
                      </span>
                      <p className="mt-1 text-sm text-foreground">
                        {loading ? <Shimmer text="Scanning local vibes…" /> : facts?.localSlang}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {index > 0 && (
                <button
                  aria-label="Previous card"
                  onClick={() => goTo(index - 1)}
                  className="absolute top-1/2 left-1 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/60 text-lg text-muted-foreground backdrop-blur-sm transition hover:bg-card hover:text-foreground"
                >
                  ‹
                </button>
              )}
              {index < 2 && (
                <button
                  aria-label="Next card"
                  onClick={() => goTo(index + 1)}
                  className="absolute top-1/2 right-1 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card/60 text-lg text-muted-foreground backdrop-blur-sm transition hover:bg-card hover:text-foreground"
                >
                  ›
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pb-3">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  aria-label={`Card ${i + 1} of 3`}
                  onClick={() => goTo(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === i ? "w-6 bg-primary" : "w-2.5 bg-border hover:bg-primary/40"
                  }`}
                />
              ))}
              <span className="ml-2 text-[11px] text-muted-foreground">Card {index + 1} of 3</span>
            </div>

            <AnimatePresence>
              {index === 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <div className="flex flex-col gap-2 p-4 sm:flex-row">
                    <button
                      onClick={onSpinAgain}
                      className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01]"
                    >
                      🌀 Spin for a New Vibe
                    </button>
                    <button
                      onClick={() => goTo(0)}
                      className="flex-1 rounded-xl border-2 border-primary bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                    >
                      📜 Relive This Spot
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
