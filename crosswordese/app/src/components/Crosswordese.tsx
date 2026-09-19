import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { crosswordData, type CrosswordCell, type CrosswordWord } from "@/data/crossword";
import { cn } from "@/lib/utils";

type SortKey = "rank" | "word" | "count" | "num";
type ClueSortKey = "num" | "count" | "rank";
const { grid, clues } = crosswordData;
const MIN_COUNT = Math.min(...grid.words.map((entry) => entry.count));
const MAX_COUNT = Math.max(...grid.words.map((entry) => entry.count));
const TOP_WORD = grid.words.reduce((best, entry) => (entry.count > best.count ? entry : best));

function mixColor(start: [number, number, number], end: [number, number, number], amount: number) {
  const values = [0, 1, 2].map((index) => {
    const startValue = start[index] ?? 0;
    const endValue = end[index] ?? 0;
    return Math.round(startValue + (endValue - startValue) * amount);
  });
  return `rgb(${values.join(", ")})`;
}

function heatColor(count: number) {
  const ratio = (count - MIN_COUNT) / (MAX_COUNT - MIN_COUNT);
  return mixColor([205, 226, 251], [13, 54, 107], ratio);
}

function heatTextColor(count: number) {
  const ratio = (count - MIN_COUNT) / (MAX_COUNT - MIN_COUNT);
  return ratio > 0.46 ? "var(--paper)" : "var(--ink)";
}

function wordKey(entry: Pick<CrosswordWord, "word" | "dir">) {
  return `${entry.word}-${entry.dir}`;
}

function compareBy<T>(a: T, b: T, ascending: boolean) {
  let result = 0;
  if (typeof a === "string" && typeof b === "string") {
    result = a.localeCompare(b);
  } else if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b));
  }
  return ascending ? result : -result;
}

function useCountUp(target: number) {
  const reducedMotion = useReducedMotion();
  const [value, setValue] = useState(reducedMotion ? target : 0);
  useEffect(() => {
    if (reducedMotion) {
      setValue(target);
      return;
    }
    const started = performance.now();
    const duration = 1250;
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);
  return value;
}

export function Crosswordese() {
  const reducedMotion = useReducedMotion();
  const [activeWords, setActiveWords] = useState<string[]>([]);
  const [lockedWords, setLockedWords] = useState<string[]>([]);
  const [tooltipCell, setTooltipCell] = useState<CrosswordCell | null>(null);
  const [clueIndexes, setClueIndexes] = useState<Record<string, number>>(() =>
    Object.fromEntries(grid.words.map((entry) => [wordKey(entry), 0])),
  );
  const [refreshingKey, setRefreshingKey] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; ascending: boolean }>({ key: "rank", ascending: true });
  const [clueSort, setClueSort] = useState<{ key: ClueSortKey; ascending: boolean }>({ key: "num", ascending: true });

  useEffect(() => {
    setClueIndexes(
      Object.fromEntries(
        grid.words.map((entry) => {
          const options = clues[entry.word] ?? [];
          return [wordKey(entry), options.length ? Math.floor(Math.random() * options.length) : 0];
        }),
      ),
    );
  }, []);

  const cellMap = useMemo(() => new Map(grid.cells.map((cell) => [`${cell.x}-${cell.y}`, cell])), []);
  const startsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of grid.words) {
      map.set(`${entry.x}-${entry.y}`, entry.num);
    }
    return map;
  }, []);
  const sortedGroups = useMemo(
    () =>
      ([0, 1] as const).map((direction) =>
        grid.words
          .filter((entry) => entry.dir === direction)
          .sort((a, b) => compareBy(a[clueSort.key], b[clueSort.key], clueSort.ascending)),
      ),
    [clueSort],
  );
  const tableRows = useMemo(() => {
    return [...grid.words].sort((a, b) => compareBy(a[sort.key], b[sort.key], sort.ascending));
  }, [sort]);

  const highlighted = activeWords.length ? activeWords : lockedWords;

  function setCellInteraction(cell: CrosswordCell | null, lock = false) {
    const keys = cell?.words.map(wordKey) ?? [];
    if (lock) setLockedWords((current) => (keys.length && keys.every((key) => current.includes(key)) ? [] : keys));
    else setActiveWords(keys);
    setTooltipCell(cell);
  }

  function refreshClue(entry: CrosswordWord) {
    const key = wordKey(entry);
    const options = clues[entry.word] ?? [];
    if (options.length < 2) return;
    setRefreshingKey(key);
    setClueIndexes((current) => {
      let next = current[key] ?? 0;
      while (next === (current[key] ?? 0)) next = Math.floor(Math.random() * options.length);
      return { ...current, [key]: next };
    });
    window.setTimeout(() => setRefreshingKey(null), reducedMotion ? 0 : 380);
  }

  function changeSort(key: SortKey) {
    setSort((current) => ({ key, ascending: current.key === key ? !current.ascending : true }));
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-strong">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <span className="font-display text-lg font-bold">Crosswordese</span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">NYT · Nov 1993–2026</span>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1500px] gap-10 border-b border-strong px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)] lg:items-end lg:px-12 lg:py-20">
        <div>
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-accent">The language of the grid</p>
          <h1 className="font-display text-[3rem] font-black leading-[0.82] tracking-normal sm:text-[clamp(4rem,11vw,9.75rem)]">Crosswordese</h1>
          <p className="mt-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            The 100 most-used answers in the New York Times crossword during the Will Shortz era, interlocked in one puzzle and shaded by frequency.
          </p>
        </div>
        <div className="border-t-2 border-foreground pt-5 lg:border-t-0 lg:border-l-2 lg:pl-8">
          <div className="font-mono text-[clamp(4rem,8vw,7.5rem)] font-semibold leading-none text-accent tabular-nums">{useCountUp(TOP_WORD.count)}</div>
          <p className="mt-3 max-w-sm font-display text-xl font-bold leading-snug">
            times <em className="not-italic text-accent">{TOP_WORD.word}</em> has appeared, the single most-used answer in the Shortz era.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-strong pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Nov. 1993–2026 · 100 answers</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">One vocabulary, interlocked</h2>
          </div>
          <div className="w-full max-w-sm" aria-label={`Frequency legend, ${MIN_COUNT} to ${MAX_COUNT} appearances`}>
            <div className="mb-2 flex justify-between font-mono text-[11px] uppercase text-muted-foreground">
              <span>{MIN_COUNT}×</span><span>Appearances</span><span>{MAX_COUNT}×</span>
            </div>
            <div className="heat-legend h-3 border border-strong" />
          </div>
        </div>

        <div className="grid gap-12 xl:grid-cols-[minmax(730px,1.15fr)_minmax(540px,.85fr)] xl:items-start">
          <div className="relative min-w-0">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground xl:hidden">Scroll to see the full grid →</p>
            <div className="crossword-scroll overflow-x-auto pb-4">
              <div
                className="grid w-max border border-strong bg-background shadow-grid"
                style={{ gridTemplateColumns: `repeat(${grid.width}, 28px)`, gridTemplateRows: `repeat(${grid.height}, 28px)` }}
                role="grid"
                aria-label="Crossword grid of the 100 most-used answers"
              >
                {Array.from({ length: grid.width * grid.height }, (_, index) => {
                  const x = index % grid.width;
                  const y = Math.floor(index / grid.width);
                  const cell = cellMap.get(`${x}-${y}`);
                  if (!cell) return <div key={`${x}-${y}`} className="bg-secondary" aria-hidden="true" />;
                  const keys = cell.words.map(wordKey);
                  const isActive = highlighted.some((key) => keys.includes(key));
                  const clueNumber = startsMap.get(`${x}-${y}`);
                  return (
                    <motion.div
                      key={`${x}-${y}`}
                      role="gridcell"
                      tabIndex={0}
                      aria-label={`${clueNumber ? `${clueNumber}. ` : ""}${cell.letter}. ${cell.words.map((entry) => `${entry.word}, ${entry.count} times, ${entry.dir === 0 ? "across" : "down"}`).join("; ")}`}
                      initial={reducedMotion ? false : { opacity: 0, y: -64 - ((x * 13 + y * 7) % 24), scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={reducedMotion ? { duration: 0 } : { delay: (x + y) * 0.022 + (x % 5) * 0.012, type: "spring", stiffness: 380, damping: 22, mass: 0.7, opacity: { duration: 0.18 } }}
                      onMouseEnter={() => setCellInteraction(cell)}
                      onMouseLeave={() => { setActiveWords([]); setTooltipCell(null); }}
                      onFocus={() => setCellInteraction(cell)}
                      onBlur={() => { setActiveWords([]); setTooltipCell(null); }}
                      onClick={() => setCellInteraction(cell, true)}
                      className={cn("relative flex cursor-pointer select-none items-center justify-center border border-cell-border font-grid text-[15px] font-bold uppercase leading-none outline-none transition-shadow duration-300 focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-accent", isActive && "z-10 ring-2 ring-accent ring-inset shadow-active")}
                      style={{ backgroundColor: heatColor(cell.maxCount), color: heatTextColor(cell.maxCount) }}
                    >
                      {clueNumber ? <span className="absolute left-[2px] top-[2px] font-mono text-[6px] leading-none">{clueNumber}</span> : null}
                      {cell.letter}
                    </motion.div>
                  );
                })}
              </div>
            </div>
            <AnimatePresence>
              {tooltipCell ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                  className="pointer-events-none mt-3 max-w-xl border-l-2 border-accent bg-tooltip px-4 py-3 text-sm shadow-tooltip"
                  role="status"
                >
                  {tooltipCell.words.map((entry) => (
                    <div key={wordKey(entry)}>
                      <span className="font-mono font-semibold">{entry.num}. {entry.word}</span> — {entry.count}× ({entry.dir === 0 ? "across" : "down"}) · rank #{entry.rank}
                    </div>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-strong pb-4">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Sort clues by</span>
              {([
                { key: "num", label: "Grid order" },
                { key: "count", label: "Appearances" },
                { key: "rank", label: "Rank" },
              ] as { key: ClueSortKey; label: string }[]).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={clueSort.key === key ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => setClueSort((current) => ({ key, ascending: current.key === key ? !current.ascending : true }))}
                >
                  {label}
                  {clueSort.key === key ? (clueSort.ascending ? " ↑" : " ↓") : null}
                </Button>
              ))}
            </div>
            <div className="grid gap-10 md:grid-cols-2 xl:max-h-[760px] xl:overflow-y-auto xl:pr-3">
            {sortedGroups.map((entries, direction) => (
              <section key={direction} aria-labelledby={`clues-${direction}`}>
                <h3 id={`clues-${direction}`} className="sticky top-0 z-20 border-y-2 border-foreground bg-background py-3 font-display text-2xl font-bold">
                  {direction === 0 ? "Across" : "Down"}
                </h3>
                <ol>
                  {entries.map((entry) => {
                    const key = wordKey(entry);
                    const options = clues[entry.word] ?? [];
                    const clue = options[clueIndexes[key] ?? 0] ?? "";
                    const isActive = highlighted.includes(key);
                    return (
                      <motion.li
                        key={key}
                        layout
                        onMouseEnter={() => setActiveWords([key])}
                        onMouseLeave={() => setActiveWords([])}
                        onFocusCapture={() => setActiveWords([key])}
                        onBlurCapture={() => setActiveWords([])}
                        onClick={() => setLockedWords((current) => current.length === 1 && current[0] === key ? [] : [key])}
                        className={cn("group grid cursor-pointer grid-cols-[2rem_minmax(0,1fr)_2rem] gap-2 border-b border-border py-3 transition-colors duration-300", isActive && "bg-highlight")}
                      >
                        <span className="pt-0.5 font-mono text-xs font-bold text-accent">{entry.num}</span>
                        <div className="min-w-0">
                          <AnimatePresence mode="wait" initial={false}>
                            <motion.p
                              key={`${key}-${clueIndexes[key] ?? 0}`}
                              initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.17 }}
                              className="text-[13px] leading-5"
                            >{clue}</motion.p>
                          </AnimatePresence>
                          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            {entry.word} · {entry.count}× · #{entry.rank}
                          </p>
                        </div>
                        {options.length > 1 ? (
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-accent"
                            onClick={(event) => { event.stopPropagation(); refreshClue(entry); }}
                            aria-label={`Show another clue for ${entry.word}`}
                            title={`Show another clue for ${entry.word}`}
                          >
                            <motion.span animate={{ rotate: refreshingKey === key ? 270 : 0 }} transition={{ duration: reducedMotion ? 0 : 0.35 }}>
                              <RefreshCw />
                            </motion.span>
                          </Button>
                        ) : <span />}
                      </motion.li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
          </div>
        </div>
      </section>

      <section className="border-y border-strong bg-secondary">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:px-12">
          <Button variant="ghost" className="w-full justify-between px-0 py-6 font-display text-xl font-bold sm:text-2xl" onClick={() => setShowTable((current) => !current)} aria-expanded={showTable}>
            <span>View all 100 as a table</span>
            <ChevronDown className={cn("transition-transform duration-300", showTable && "rotate-180")} />
          </Button>
          <AnimatePresence initial={false}>
            {showTable ? (
              <motion.div initial={reducedMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="overflow-x-auto pt-5">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead className="border-y-2 border-foreground font-mono text-xs uppercase">
                      <tr>
                        {(["rank", "word", "count", "num"] as SortKey[]).map((key) => (
                          <th key={key} className="py-3 pr-5">
                            <Button variant="ghost" className="h-auto p-0 uppercase" onClick={() => changeSort(key)}>
                              {key === "num" ? "Clue no." : key}{sort.key === key ? (sort.ascending ? " ↑" : " ↓") : ""}
                            </Button>
                          </th>
                        ))}
                        <th className="py-3">Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((entry) => (
                        <tr key={wordKey(entry)} className="border-b border-border text-sm">
                          <td className="py-2.5 pr-5 font-mono">#{entry.rank}</td>
                          <td className="py-2.5 pr-5 font-grid font-bold">{entry.word}</td>
                          <td className="py-2.5 pr-5 font-mono">{entry.count}×</td>
                          <td className="py-2.5 pr-5 font-mono">{entry.num}</td>
                          <td className="py-2.5 capitalize">{entry.dir === 0 ? "across" : "down"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <footer className="mx-auto max-w-[1500px] px-5 py-10 sm:px-8 lg:px-12">
        <p className="max-w-5xl text-xs leading-6 text-muted-foreground">
          Sources: Rankings and counts are <a href="https://www.xwordinfo.com/Popular" target="_blank" rel="noreferrer" className="story-link text-foreground">XWord Info's "Modern Era" tally</a> of New York Times crossword answers, Nov 1993–2026 (the Will Shortz era, ~33 years). Clues are real, historical NYT clues pulled from the <a href="https://xd.saul.pw/data" target="_blank" rel="noreferrer" className="story-link text-foreground">xd crossword corpus</a> (<a href="https://github.com/century-arcade/xd" target="_blank" rel="noreferrer" className="story-link text-foreground">github.com/century-arcade/xd</a>), filtered to Modern Era puzzles — up to six per word, sampled by how often each clue itself recurred. Several ranks are ties (e.g. #52 ECO/TEA, #82 ACRE/ETAL).
        </p>
      </footer>
    </main>
  );
}
