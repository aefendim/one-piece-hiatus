import { cn } from "@/lib/utils";

const items: { label: string; className: string }[] = [
  { label: "Chapter released", className: "bg-primary" },
  { label: "Chapter planned", className: "bg-planned" },
  { label: "Hiatus / break", className: "bg-hiatus" },
  { label: "Upcoming", className: "border border-dashed border-primary/50" },
];

export function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className={cn("h-3 w-3 rounded-[3px]", it.className)} />
          {it.label}
        </div>
      ))}
    </div>
  );
}
