export interface Chapter {
  number: number;
  title: string;
  volume: number | null;
  /** ISO date string, e.g. "2021-01-04" (official WSJ Japanese release). */
  releaseDate: string;
  wsjIssue: string | null;
}

export interface ChaptersFile {
  meta: {
    lastUpdated: string;
    latestChapter: number;
    totalChapters: number;
  };
  chapters: Chapter[];
}

export type CellState = "released" | "planned" | "hiatus" | "future" | "pre";

export interface WeekCell {
  isoYear: number;
  isoWeek: number;
  state: CellState;
  /** Chapters that released during this ISO week (usually 0 or 1). */
  chapters: Chapter[];
  /** Monday (start) of this ISO week. */
  weekStart: Date;
}

export interface YearRow {
  year: number;
  weeks: WeekCell[];
}

export interface ChartStats {
  totalChapters: number;
  firstChapterDate: string | null;
  latestChapterDate: string | null;
  activeWeeks: number;
  releasedWeeks: number;
  hiatusWeeks: number;
  longestHiatus: number;
  hiatusRate: number;
}
