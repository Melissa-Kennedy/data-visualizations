import rawData from "./crosswordese-data.json";

export type Direction = 0 | 1;

export type CrosswordWord = {
  word: string;
  count: number;
  rank: number;
  x: number;
  y: number;
  dir: Direction;
  num: number;
};

export type CellWord = Pick<CrosswordWord, "word" | "count" | "rank" | "dir" | "num">;

export type CrosswordCell = {
  x: number;
  y: number;
  letter: string;
  maxCount: number;
  words: CellWord[];
};

export type CrosswordData = {
  grid: {
    width: number;
    height: number;
    islands: number;
    count: number;
    words: CrosswordWord[];
    cells: CrosswordCell[];
  };
  clues: Record<string, string[]>;
};

export const crosswordData = rawData as CrosswordData;
