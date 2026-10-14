import { Card, CardContent } from "@/components/ui/card";
import type { ChartStats } from "@/types";
import { formatISODateLong } from "@/lib/isoWeek";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export function StatsBar({ stats }: { stats: ChartStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Stat value={stats.totalChapters.toLocaleString()} label="Chapters" />
      <Stat
        value={stats.hiatusWeeks.toLocaleString()}
        label="Hiatus weeks"
      />
      <Stat
        value={`${Math.round(stats.hiatusRate * 100)}%`}
        label="Break rate"
      />
      <Stat
        value={`${stats.longestHiatus} wk`}
        label="Longest break"
      />
      <Stat
        value={
          stats.latestChapterDate
            ? formatISODateLong(stats.latestChapterDate)
            : "—"
        }
        label="Latest chapter"
      />
    </div>
  );
}
