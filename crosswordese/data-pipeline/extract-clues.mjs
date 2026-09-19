import fs from 'fs';
import readline from 'readline';
import { DATA } from './data100.mjs';

const WORDS = new Set(DATA.map(([w]) => w));
const clueMap = new Map();
for (const w of WORDS) clueMap.set(w, new Map()); // clueText -> count (track frequency of that exact clue)

const rl = readline.createInterface({
  input: fs.createReadStream('./nyt_modern_clues.tsv'),
  crlfDelay: Infinity,
});

let total = 0;
rl.on('line', (line) => {
  total++;
  const tab1 = line.indexOf('\t');
  const tab2 = line.indexOf('\t', tab1 + 1);
  const tab3 = line.indexOf('\t', tab2 + 1);
  const answer = line.slice(tab2 + 1, tab3);
  if (!WORDS.has(answer)) return;
  const clue = line.slice(tab3 + 1).trim();
  if (!clue) return;
  // skip clues that are just cross-references or too short/odd, keep general
  const m = clueMap.get(answer);
  m.set(clue, (m.get(clue) || 0) + 1);
});

rl.on('close', () => {
  const out = {};
  let wordsWithClues = 0, totalClues = 0, minClues = Infinity;
  for (const w of WORDS) {
    const m = clueMap.get(w);
    // sort by frequency desc (common clues first are usually cleaner/canonical),
    // then take a diverse sample: top 5 most-used + a few less-common ones for variety
    const entries = [...m.entries()].sort((a,b) => b[1]-a[1]);
    const chosen = [];
    for (const [clue] of entries) {
      if (chosen.length >= 6) break;
      // avoid near-duplicate clues (case/punctuation variants)
      const norm = clue.toLowerCase().replace(/[^a-z0-9]/g,'');
      if (chosen.some(c => c.toLowerCase().replace(/[^a-z0-9]/g,'') === norm)) continue;
      chosen.push(clue);
    }
    out[w] = chosen;
    if (chosen.length) wordsWithClues++;
    totalClues += chosen.length;
    minClues = Math.min(minClues, chosen.length);
  }
  fs.writeFileSync('./clues.json', JSON.stringify(out));
  console.log('total tsv rows scanned:', total);
  console.log('words with >=1 clue:', wordsWithClues, '/', WORDS.size);
  console.log('total embedded clues:', totalClues);
  console.log('min clues for any word:', minClues);
  const zero = [...WORDS].filter(w => !out[w] || out[w].length===0);
  console.log('words with ZERO clues found:', zero);
});
