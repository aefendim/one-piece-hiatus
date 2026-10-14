/**
 * ISO-8601 week helpers. Weeks start on Monday; week 1 is the week
 * containing the first Thursday of the year.
 */

/** Parse a "YYYY-MM-DD" string into a UTC Date (avoids timezone drift). */
export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Return the ISO year and week number for a given date. */
export function getISOWeek(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  // Thursday in current week decides the year.
  const day = d.getUTCDay() || 7; // Sunday => 7
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { isoYear, isoWeek };
}

/** Number of ISO weeks (52 or 53) in a given ISO year. */
export function isoWeeksInYear(isoYear: number): number {
  const p = (y: number) =>
    (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
  return p(isoYear) === 4 || p(isoYear - 1) === 3 ? 53 : 52;
}

/** Monday (UTC) that starts the given ISO year+week. */
export function isoWeekStart(isoYear: number, isoWeek: number): Date {
  const simple = new Date(Date.UTC(isoYear, 0, 1 + (isoWeek - 1) * 7));
  const day = simple.getUTCDay() || 7;
  // ISO week 1's Monday: shift back to Monday of the week containing Jan 4.
  const mondayOffset = day <= 4 ? 1 - day : 8 - day;
  simple.setUTCDate(simple.getUTCDate() + mondayOffset);
  return simple;
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatISODateLong(s: string): string {
  return formatDateLong(parseISODate(s));
}
