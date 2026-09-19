# Crosswordese

**Live app: [crosswordese.lovable.app](https://crosswordese.lovable.app)**

The 100 most-used answer words in the New York Times crossword (Will Shortz
era, Nov 1993–2026), interlocked into one real crossword grid and shaded by
how often each word has run. Real historical clues sit beside the grid like
an actual Across/Down clue list, with a working "show another clue" refresh.

Every crossing in the grid is genuine (both words really do share that
letter), every clue number follows the real crossword numbering convention
(an Across/Down pair starting on the same square shares one number), and
every clue is a real, historically-used NYT clue — nothing here is generated
or invented. See [`data-pipeline/README.md`](./data-pipeline/README.md) for
exactly how.

## What's in this folder

| Path | What it is |
|---|---|
| [`app/`](./app) | The production build — a TanStack Start + React + Tailwind app (built with [Lovable](https://lovable.dev)), animated with Motion: staggered grid reveal on load, synced hover-highlighting between the grid and clue lists, a count-up hero stat, and non-repeating clue cycling. |
| [`prototype/`](./prototype) | The original single-file static HTML prototype this was built from — no build step, no dependencies, open `index.html` directly in a browser. |
| [`data-pipeline/`](./data-pipeline) | The scripts and data that produced everything: word frequency + rank, the crossword-packing/numbering algorithm, and the real-clue extraction. |

## Sources

- **Rankings and counts:** [XWord Info](https://www.xwordinfo.com/Popular)'s
  "Modern Era" tally of NYT crossword answers, Nov 1993–2026 (~33 years).
  XWord Info's own preset windows are "Modern Era" and "All Time" (since
  1942) — neither is an exact trailing 50 years, so "the Shortz era" is used
  here rather than a literal 50-year claim.
- **Clues:** the [xd crossword corpus](https://xd.saul.pw/data)
  ([`century-arcade/xd`](https://github.com/century-arcade/xd)), filtered to
  Modern Era NYT puzzles — up to 6 real clues per word.

## Running the app locally

```sh
cd app
npm i
npm run dev
```
