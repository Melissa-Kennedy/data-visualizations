# Data pipeline

How the numbers in Crosswordese were produced. Nothing here is fabricated —
every word, count, grid position, clue number, and clue string traces back to
one of the two public sources below.

## 1. Word frequency + rank

Source: [XWord Info](https://www.xwordinfo.com/Popular)'s "Modern Era" tally
of New York Times crossword answers (Will Shortz era, Nov 1993–2026). The top
100 words with their appearance counts and ranks are hardcoded in
[`data100.mjs`](./data100.mjs), transcribed directly from that page (ties are
preserved, e.g. rank 52 = ECO/TEA).

## 2. Grid layout + numbering

[`generate-grid.mjs`](./generate-grid.mjs) reads `data100.mjs` and:

1. Greedily packs all 100 words into one interlocking crossword grid,
   longest words first, only crossing on genuinely shared letters (tries
   several tie-break orderings and keeps whichever produces the fewest
   disconnected fragments and the most square-ish bounding box).
2. Numbers every cell using the real crossword convention: scan the grid
   top-to-bottom, left-to-right; a cell gets the next number if it starts an
   Across and/or a Down entry. A cell that starts both shares one number.

Output: [`cells100.json`](./cells100.json) — grid dimensions, every placed
word (`word, count, rank, x, y, dir, num`), and every occupied cell with its
letter and the word(s) crossing it.

```sh
node generate-grid.mjs
```

## 3. Real clues

Source: the [xd crossword corpus](https://xd.saul.pw/data)
([`century-arcade/xd`](https://github.com/century-arcade/xd)) — a public,
actively maintained dataset of 6M+ real clue/answer pairs across many
publications. It is **not vendored here** (the extracted TSV is ~270MB); to
regenerate:

```sh
curl -sL -o xd-clues.zip https://xd.saul.pw/xd-clues.zip
unzip -p xd-clues.zip xd/clues.tsv | awk -F'\t' '$1=="nyt" && $2>=1993' > nyt_modern_clues.tsv
node extract-clues.mjs
```

[`extract-clues.mjs`](./extract-clues.mjs) reads `nyt_modern_clues.tsv`,
keeps only rows whose answer is one of the 100 words in `data100.mjs`,
dedupes clue text per word, and keeps up to 6 per word — ranked by how often
that exact clue phrasing recurred (most-canonical first).

Output: [`clues.json`](./clues.json) — `{ "WORD": ["clue 1", "clue 2", ...] }`.

## 4. Combining

`cells100.json` and `clues.json` are merged into one file
(`{ grid: ..., clues: ... }`) and consumed as-is by both
[`../prototype/index.html`](../prototype/index.html) and the Lovable app at
[`../app/src/data/crosswordese-data.json`](../app/src/data/crosswordese-data.json).
