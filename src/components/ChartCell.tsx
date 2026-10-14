import { memo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDateLong, formatISODateLong } from "@/lib/isoWeek";
import type { WeekCell } from "@/types";

const stateClasses: Record<WeekCell["state"], string> = {
  released: "bg-primary hover:ring-2 hover:ring-primary/40",
  planned: "bg-planned hover:ring-2 hover:ring-planned/40",
  hiatus: "bg-hiatus hover:ring-2 hover:ring-muted-foreground/30",
  future: "bg-transparent border border-dashed border-primary/50",
  pre: "bg-transparent",
};

function ChartCellBase({ cell }: { cell: WeekCell }) {
  const base = (
    <div
      className={cn(
        "aspect-square w-full rounded-[3px] transition-all duration-150",
        stateClasses[cell.state]
      )}
    />
  );

  // Pre-series weeks are inert placeholders; no tooltip needed.
  if (cell.state === "pre") return base;

  const weekLabel = `${cell.isoYear} · W${String(cell.isoWeek).padStart(2, "0")}`;

  return (
    <Tooltip delayDuration={80}>
      <TooltipTrigger asChild>{base}</TooltipTrigger>
      <TooltipContent>
        <div className="space-y-0.5">
          <div className="font-medium text-foreground">{weekLabel}</div>
          <div className="text-muted-foreground">
            week of {formatDateLong(cell.weekStart)}
          </div>
          {cell.state === "released" || cell.state === "planned" ? (
            cell.chapters.map((ch) => (
              <div key={ch.number} className="pt-0.5 text-foreground">
                <span className="font-semibold">Ch. {ch.number}</span>
                {ch.title ? ` — ${ch.title}` : ""}
                <div className="text-muted-foreground">
                  {cell.state === "planned" ? "planned for" : "released"}{" "}
                  {formatISODateLong(ch.releaseDate)}
                </div>
              </div>
            ))
          ) : cell.state === "hiatus" ? (
            <div className="pt-0.5 font-medium text-muted-foreground">
              Hiatus — no chapter
            </div>
          ) : (
            <div className="pt-0.5 text-muted-foreground">Upcoming</div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export const ChartCell = memo(ChartCellBase);
