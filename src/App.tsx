import { useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HiatusChart } from "@/components/HiatusChart";
import { Legend } from "@/components/Legend";
import { StatsBar } from "@/components/StatsBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildChart, computeStats } from "@/lib/chart";
import { formatISODateLong } from "@/lib/isoWeek";
import type { ChaptersFile } from "@/types";

export default function App() {
  const [data, setData] = useState<ChaptersFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/chapters.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: ChaptersFile) => setData(json))
      .catch((e) => setError(String(e)));
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    return computeStats(buildChart(data.chapters), data.chapters);
  }, [data]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container max-w-5xl py-10 sm:py-14">
          {/* Header */}
          <header className="mb-8 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-[3px] bg-primary" />
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  One Piece Hiatus Chart
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Every week of the series since 1997. Filled cells are weeks a
                chapter was published; blank cells are breaks and hiatuses.
              </p>
            </div>
            <ThemeToggle />
          </header>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load chapter data: {error}
            </div>
          )}

          {!data && !error && (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-muted" />
                ))}
              </div>
              <div className="h-80 rounded-lg bg-muted" />
            </div>
          )}

          {data && stats && (
            <div className="animate-fade-in space-y-8">
              <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Weekly release grid
                  </h2>
                  <Legend />
                </div>
                <HiatusChart chapters={data.chapters} />
              </section>

              <StatsBar stats={stats} />

              <footer className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Data last updated {formatISODateLong(data.meta.lastUpdated)} ·{" "}
                  {data.meta.totalChapters.toLocaleString()} chapters
                </span>
                <span>
                  Source:{" "}
                  <a
                    className="underline underline-offset-2 hover:text-foreground"
                    href="https://onepiece.fandom.com/wiki/Chapters_and_Volumes"
                    target="_blank"
                    rel="noreferrer"
                  >
                    One Piece Wiki
                  </a>
                </span>
              </footer>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
