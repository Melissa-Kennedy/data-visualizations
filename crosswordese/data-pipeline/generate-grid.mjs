import { DATA } from './data100.mjs';
import fs from 'fs';

const words = DATA.map(([word,count,rank])=>({word,count,rank}));

function key(x,y){ return x+","+y; }

function runLayout(order){
  const grid = new Map();
  const placed = [];

  function canPlace(word, x, y, dir){
    const len = word.length;
    const bx = dir===0 ? x-1 : x, by = dir===0 ? y : y-1;
    const ax = dir===0 ? x+len : x, ay = dir===0 ? y : y+len;
    if (grid.has(key(bx,by))) return false;
    if (grid.has(key(ax,ay))) return false;
    let hasIntersection = false;
    for(let i=0;i<len;i++){
      const cx = dir===0 ? x+i : x;
      const cy = dir===0 ? y : y+i;
      const k = key(cx,cy);
      if (grid.has(k)){
        if (grid.get(k) !== word[i]) return false;
        hasIntersection = true;
      } else {
        if (dir===0){
          if (grid.has(key(cx,cy-1)) || grid.has(key(cx,cy+1))) return false;
        } else {
          if (grid.has(key(cx-1,cy)) || grid.has(key(cx+1,cy))) return false;
        }
      }
    }
    return hasIntersection;
  }
  function place(word, x, y, dir){
    const len = word.length;
    for(let i=0;i<len;i++){
      const cx = dir===0 ? x+i : x;
      const cy = dir===0 ? y : y+i;
      grid.set(key(cx,cy), word[i]);
    }
  }
  function bbox(){
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const k of grid.keys()){
      const [x,y] = k.split(",").map(Number);
      minX=Math.min(minX,x); maxX=Math.max(maxX,x);
      minY=Math.min(minY,y); maxY=Math.max(maxY,y);
    }
    return {minX,minY,maxX,maxY};
  }

  {
    const first = order[0];
    place(first.word, 0, 0, 0);
    placed.push({...first, x:0, y:0, dir:0});
  }

  for (let idx=1; idx<order.length; idx++){
    const w = order[idx];
    let best = null, bestScore = Infinity;
    for (const p of placed){
      for (let i=0;i<p.word.length;i++){
        for (let j=0;j<w.word.length;j++){
          if (p.word[i] !== w.word[j]) continue;
          const newDir = p.dir===0 ? 1 : 0;
          let ix, iy;
          if (p.dir===0){ ix = p.x+i; iy = p.y; } else { ix = p.x; iy = p.y+i; }
          const nx = newDir===0 ? ix-j : ix;
          const ny = newDir===0 ? iy : iy-j;
          if (canPlace(w.word, nx, ny, newDir)){
            const before = bbox();
            const added = [];
            for(let k2=0;k2<w.word.length;k2++){
              const cx = newDir===0? nx+k2 : nx;
              const cy = newDir===0? ny : ny+k2;
              const k3 = key(cx,cy);
              if (!grid.has(k3)){ grid.set(k3, w.word[k2]); added.push(k3); }
            }
            const after = bbox();
            const growth = (after.maxX-after.minX)*(after.maxY-after.minY) - (before.maxX-before.minX)*(before.maxY-before.minY);
            for (const k3 of added) grid.delete(k3);
            if (growth < bestScore){
              bestScore = growth;
              best = {x:nx,y:ny,dir:newDir};
            }
          }
        }
      }
    }
    if (best){
      place(w.word, best.x, best.y, best.dir);
      placed.push({...w, x:best.x, y:best.y, dir:best.dir});
    } else {
      const {minX,minY,maxX,maxY} = bbox();
      const w_ = maxX-minX, h_ = maxY-minY;
      let fx, fy;
      if (w_ <= h_){ fx = maxX+2; fy = minY; } else { fx = minX; fy = maxY+2; }
      place(w.word, fx, fy, 0);
      placed.push({...w, x:fx, y:fy, dir:0, island:true});
    }
  }

  const {minX,minY,maxX,maxY} = bbox();
  const norm = placed.map(p => ({...p, x:p.x-minX, y:p.y-minY}));
  const W = maxX-minX+1, H = maxY-minY+1;
  const islands = norm.filter(p=>p.island).length;
  return {norm, W, H, islands};
}

function mulberry32(seed){
  return function(){
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffleWithinLengthGroups(arr, seed){
  const rnd = mulberry32(seed);
  const groups = new Map();
  for (const w of arr){
    if (!groups.has(w.word.length)) groups.set(w.word.length, []);
    groups.get(w.word.length).push(w);
  }
  const lengths = [...groups.keys()].sort((a,b)=>b-a);
  const out = [];
  for (const len of lengths){
    const g = groups.get(len).slice();
    for (let i=g.length-1;i>0;i--){
      const j = Math.floor(rnd()*(i+1));
      [g[i],g[j]] = [g[j],g[i]];
    }
    out.push(...g);
  }
  return out;
}

const attempts = [];
attempts.push([...words].sort((a,b)=> b.word.length-a.word.length || b.count-a.count));
attempts.push([...words].sort((a,b)=> b.word.length-a.word.length || a.count-b.count));
for (let s=1; s<=8; s++){
  attempts.push(shuffleWithinLengthGroups(words, s*97+13));
}

let bestResult = null;
for (const order of attempts){
  const r = runLayout(order);
  const aspect = Math.max(r.W,r.H)/Math.min(r.W,r.H);
  const score = r.islands*10000 + r.W*r.H*0.01 + aspect*50;
  r.score = score;
  if (!bestResult || score < bestResult.score) bestResult = r;
}

const { norm, W, H, islands } = bestResult;

const finalGrid = new Map();
for (const w of norm){
  for (let i=0;i<w.word.length;i++){
    const cx = w.dir===0 ? w.x+i : w.x;
    const cy = w.dir===0 ? w.y : w.y+i;
    finalGrid.set(key(cx,cy), w.word[i]);
  }
}
function isLetter(x,y){ return finalGrid.has(key(x,y)); }

const cellNumber = new Map();
let counter = 0;
for (let y=0;y<H;y++){
  for (let x=0;x<W;x++){
    if (!isLetter(x,y)) continue;
    const startsAcross = !isLetter(x-1,y) && isLetter(x+1,y);
    const startsDown = !isLetter(x,y-1) && isLetter(x,y+1);
    if (startsAcross || startsDown){
      counter++;
      cellNumber.set(key(x,y), counter);
    }
  }
}

const wordsOut = norm.map(w => {
  const num = cellNumber.get(key(w.x,w.y));
  return {word:w.word, count:w.count, rank:w.rank, x:w.x, y:w.y, dir:w.dir, num};
});

const cellMapOut = new Map();
for (const w of wordsOut){
  for (let i=0;i<w.word.length;i++){
    const cx = w.dir===0 ? w.x+i : w.x;
    const cy = w.dir===0 ? w.y : w.y+i;
    const k = key(cx,cy);
    if (!cellMapOut.has(k)) cellMapOut.set(k, {x:cx,y:cy,letter:w.word[i],words:[]});
    cellMapOut.get(k).words.push({num:w.num, rank:w.rank, count:w.count, word:w.word, dir:w.dir, isStart:i===0});
  }
}
const cells = Array.from(cellMapOut.values()).map(c=>{
  const dominant = c.words.reduce((a,b)=> b.count>a.count?b:a, c.words[0]);
  return {x:c.x,y:c.y,letter:c.letter,maxCount:dominant.count,words:c.words.map(w=>({num:w.num,rank:w.rank,count:w.count,word:w.word,dir:w.dir}))};
});

const out = {width:W, height:H, islands, count:wordsOut.length, words:wordsOut, cells};
fs.writeFileSync(new URL('./cells100.json', import.meta.url), JSON.stringify(out));
console.log('BEST -> width',W,'height',H,'islands',islands,'words',wordsOut.length,'cells',cells.length,'maxNum',counter);
console.log('all attempts:', attempts.map((o,i)=>{const r=runLayout(o); return {i,W:r.W,H:r.H,islands:r.islands};}));
