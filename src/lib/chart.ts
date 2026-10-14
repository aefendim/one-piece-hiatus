import type { Chapter, ChartStats, WeekCell, YearRow } from "@/types";
import {
  getISOWeek,
  isoWeekStart,
  isoWeeksInYear,
  parseISODate,
} from "./isoWeek";

/**
 * Build the year x ISO-week grid from a list of chapters.
 *
 * - "released": a chapter maps to this week.
 * - "planned":  a chapter maps to this week, but its release date is still ahead.
 * - "hiatus":  a week inside the active span with no chapter (a break).
 * - "pre":      before the first chapter.
 * - "future":   after the latest occurred week (not yet happened).
 */
export function buildChart(
  chapters: Chapter[],
  now: Date = new Date()
): YearRow[] {
  if (chapters.length === 0) return [];

  const sorted = [...chapters].sort((a, b) => a.number - b.number);

  // Map "isoYear-isoWeek" -> chapters released in it.
  const byWeek = new Map<string, Chapter[]>();
  for (const ch of sorted) {
    const { isoYear, isoWeek } = getISOWeek(parseISODate(ch.releaseDate));
    const key = `${isoYear}-${isoWeek}`;
    const arr = byWeek.get(key);
    if (arr) arr.push(ch);
    else byWeek.set(key, [ch]);
  }

  const firstDate = parseISODate(sorted[0].releaseDate);
  const first = getISOWeek(firstDate);
  const nowWeek = getISOWeek(now);

  const startYear = first.isoYear;
  // Include the year of the last scheduled chapter, in case it is next year.
  const last = getISOWeek(parseISODate(sorted[sorted.length - 1].releaseDate));
  const endYear = Math.max(nowWeek.isoYear, startYear, last.isoYear);

  const rows: YearRow[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const totalWeeks = isoWeeksInYear(year);
    const weeks: WeekCell[] = [];
    for (let week = 1; week <= totalWeeks; week++) {
      const key = `${year}-${week}`;
      const cellChapters = byWeek.get(key) ?? [];
      const weekStart = isoWeekStart(year, week);

      let state: WeekCell["state"];
      if (cellChapters.length > 0) {
        const allAhead = cellChapters.every(
          (ch) => parseISODate(ch.releaseDate) > now
        );
        state = allAhead ? "planned" : "released";
      } else if (
        year < first.isoYear ||
        (year === first.isoYear && week < first.isoWeek)
      ) {
        state = "pre";
      } else if (
        year > nowWeek.isoYear ||
        (year === nowWeek.isoYear && week > nowWeek.isoWeek)
      ) {
        state = "future";
      } else {
        state = "hiatus";
      }

      weeks.push({ isoYear: year, isoWeek: week, state, chapters: cellChapters, weekStart });
    }
    rows.push({ year, weeks });
  }

  return rows;
}

export function computeStats(
  rows: YearRow[],
  chapters: Chapter[],
  now: Date = new Date()
): ChartStats {
  // Planned chapters haven't come out yet, so they don't count toward stats.
  const released = chapters.filter((ch) => parseISODate(ch.releaseDate) <= now);
  const sorted = [...released].sort((a, b) => a.number - b.number);
  let releasedWeeks = 0;
  let hiatusWeeks = 0;
  let longestHiatus = 0;
  let currentStreak = 0;

  const flat = rows.flatMap((r) => r.weeks);
  for (const cell of flat) {
    if (cell.state === "released") {
      releasedWeeks++;
      currentStreak = 0;
    } else if (cell.state === "hiatus") {
      hiatusWeeks++;
      currentStreak++;
      if (currentStreak > longestHiatus) longestHiatus = currentStreak;
    }
  }

  const activeWeeks = releasedWeeks + hiatusWeeks;

  return {
    totalChapters: released.length,
    firstChapterDate: sorted[0]?.releaseDate ?? null,
    latestChapterDate: sorted[sorted.length - 1]?.releaseDate ?? null,
    activeWeeks,
    releasedWeeks,
    hiatusWeeks,
    longestHiatus,
    hiatusRate: activeWeeks > 0 ? hiatusWeeks / activeWeeks : 0,
  };
}
