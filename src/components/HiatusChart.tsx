import { useMemo } from "react";
import { ChartCell } from "./ChartCell";
import { buildChart } from "@/lib/chart";
import type { Chapter } from "@/types";

const WEEK_TICKS = [1, 10, 20, 30, 40, 50];
const MAX_WEEKS = 53;

export function HiatusChart({ chapters }: { chapters: Chapter[] }) {
  const rows = useMemo(() => buildChart(chapters), [chapters]);

  return (
    <div className="chart-scroll overflow-x-auto pb-2">
      <div className="min-w-[760px]">
        {/* Week ruler */}
        <div className="mb-2 flex items-center gap-2">
          <div className="w-10 shrink-0" />
          <div
            className="grid flex-1 gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${MAX_WEEKS}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: MAX_WEEKS }, (_, i) => i + 1).map((w) => (
              <div
                key={w}
                className="text-center text-[9px] leading-none text-muted-foreground"
              >
                {WEEK_TICKS.includes(w) ? w : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Year rows */}
        <div className="space-y-[3px]">
          {rows.map((row) => (
            <div key={row.year} className="flex items-center gap-2">
              <div className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                {row.year}
              </div>
              <div
                className="grid flex-1 gap-[3px]"
                style={{
                  gridTemplateColumns: `repeat(${MAX_WEEKS}, minmax(0, 1fr))`,
                }}
              >
                {row.weeks.map((cell) => (
                  <ChartCell key={cell.isoWeek} cell={cell} />
                ))}
                {/* Pad short (52-week) years so columns stay aligned. */}
                {row.weeks.length < MAX_WEEKS &&
                  Array.from(
                    { length: MAX_WEEKS - row.weeks.length },
                    (_, i) => <div key={`pad-${i}`} />
                  )}
              </div>
            </div>
          ))}
        </div>

        {/* Week axis label */}
        <div className="mt-2 flex items-center gap-2">
          <div className="w-10 shrink-0" />
          <div className="flex-1 text-[10px] text-muted-foreground">
            ISO week of year →
          </div>
        </div>
      </div>
    </div>
  );
}
