/**
 * One Piece chapter scraper.
 *
 * Pulls chapter release dates from the One Piece Fandom wiki using the
 * MediaWiki parse API (rendered HTML), and writes them to
 * public/data/chapters.json.
 *
 * Usage:
 *   tsx scripts/scrape.ts          # incremental: resume after last known chapter
 *   tsx scripts/scrape.ts --full   # rebuild everything from chapter 1
 *
 * Notes:
 *   - The infobox "Release Date" is NOT present in the raw wikitext (it is
 *     templated), so we must parse the rendered HTML (prop=text).
 *   - A nonexistent chapter page returns {"error":{"code":"missingtitle"}},
 *     which is our stop condition for "no new chapter yet".
 */

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseHTML } from "node-html-parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, "../public/data/chapters.json");

const API = "https://onepiece.fandom.com/api.php";
const USER_AGENT =
  "OnePieceHiatusChart/1.0 (static hiatus chart; contact via repo issues)";
const DELAY_MS = 350;
const MAX_RETRIES = 3;
const SAFETY_CAP = 3000; // absolute upper bound on chapter number

interface Chapter {
  number: number;
  title: string;
  volume: number | null;
  releaseDate: string;
  wsjIssue: string | null;
}

interface ChaptersFile {
  meta: { lastUpdated: string; latestChapter: number; totalChapters: number };
  chapters: Chapter[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchParse(page: string): Promise<any | null> {
  const url = `${API}?action=parse&page=${encodeURIComponent(
    page
  )}&prop=text&format=json&redirects=1&disablelimitreport=1`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as any;
      if (json.error) {
        if (json.error.code === "missingtitle") return null; // page doesn't exist
        throw new Error(`API error: ${json.error.code}`);
      }
      return json;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      console.warn(`  retry ${attempt}/${MAX_RETRIES} for ${page}: ${err}`);
      await sleep(DELAY_MS * attempt * 2);
    }
  }
  return null;
}

/** US "Month D, YYYY" -> "YYYY-MM-DD", or null if unparseable. */
function parseReleaseDate(raw: string): string | null {
  const cleaned = raw.replace(/\[.*?\]/g, "").trim();
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Read a labeled infobox value from the rendered HTML. */
function readInfoboxValue(root: ReturnType<typeof parseHTML>, label: string): string | null {
  for (const item of root.querySelectorAll(".pi-item.pi-data")) {
    const h = item.querySelector(".pi-data-label");
    if (h && h.text.trim().toLowerCase().startsWith(label.toLowerCase())) {
      const v = item.querySelector(".pi-data-value");
      if (v) return v.text.trim();
    }
  }
  return null;
}

function extractChapter(number: number, html: string): Chapter | null {
  const root = parseHTML(html);

  const dateRaw = readInfoboxValue(root, "Release Date");
  if (!dateRaw) return null; // likely a brand-new chapter with no date yet
  const releaseDate = parseReleaseDate(dateRaw);
  if (!releaseDate) {
    console.warn(`  chapter ${number}: unparseable date "${dateRaw}"`);
    return null;
  }

  const title = readInfoboxValue(root, "Viz Title") ?? "";

  const volRaw = readInfoboxValue(root, "Volume");
  const volMatch = volRaw?.match(/\d+/);
  const volume = volMatch ? Number(volMatch[0]) : null;

  const wsjIssue = readInfoboxValue(root, "WSJ Issue");

  return { number, title, volume, releaseDate, wsjIssue };
}

async function writeOutput(chapters: Chapter[]): Promise<void> {
  const sorted = [...chapters].sort((a, b) => a.number - b.number);
  const latest = sorted.reduce((m, c) => Math.max(m, c.number), 0);
  const out: ChaptersFile = {
    meta: {
      lastUpdated: new Date().toISOString().slice(0, 10),
      latestChapter: latest,
      totalChapters: sorted.length,
    },
    chapters: sorted,
  };
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");
}

async function loadExisting(): Promise<Chapter[]> {
  if (!existsSync(DATA_PATH)) return [];
  try {
    const parsed = JSON.parse(await readFile(DATA_PATH, "utf8")) as ChaptersFile;
    return parsed.chapters ?? [];
  } catch {
    return [];
  }
}

async function main() {
  const full = process.argv.includes("--full");

  let chapters = full ? [] : await loadExisting();
  const existingMax = chapters.reduce((m, c) => Math.max(m, c.number), 0);
  let n = full ? 1 : existingMax + 1;

  console.log(
    full
      ? "Full rebuild starting from chapter 1..."
      : `Incremental scrape: ${chapters.length} known, resuming at chapter ${n}...`
  );

  // Allow a couple of misses before giving up (handles numbering gaps).
  let consecutiveMisses = 0;
  const MISS_TOLERANCE = 2;
  let added = 0;

  for (; n <= SAFETY_CAP; n++) {
    const json = await fetchParse(`Chapter_${n}`);
    await sleep(DELAY_MS);

    if (json === null) {
      consecutiveMisses++;
      console.log(`  Chapter ${n}: page missing (${consecutiveMisses}/${MISS_TOLERANCE})`);
      if (consecutiveMisses > MISS_TOLERANCE) {
        console.log(`Stopping: no chapter pages beyond ${n - consecutiveMisses}.`);
        break;
      }
      continue;
    }
    consecutiveMisses = 0;

    const html: string = json.parse?.text?.["*"] ?? "";
    const chapter = extractChapter(n, html);
    if (!chapter) {
      console.log(`  Chapter ${n}: exists but no release date yet (skipping, will retry next run).`);
      // Stop here on incremental runs: a dateless page means "not released".
      break;
    }

    chapters.push(chapter);
    added++;
    console.log(`  Chapter ${n}: ${chapter.releaseDate}  ${chapter.title || "(untitled)"}`);

    // Checkpoint periodically so a long run can survive interruption/resume.
    if (added % 50 === 0) {
      await writeOutput(chapters);
      console.log(`  ...checkpoint saved (${chapters.length} chapters).`);
    }
  }

  chapters.sort((a, b) => a.number - b.number);
  const latest = chapters.reduce((m, c) => Math.max(m, c.number), 0);

  await writeOutput(chapters);

  console.log(
    `\nDone. Added ${added} chapter(s). Total ${chapters.length}, latest #${latest}.`
  );
  console.log(`Wrote ${DATA_PATH}`);
}

main().catch((err) => {
  console.error("Scrape failed:", err);
  process.exit(1);
});
