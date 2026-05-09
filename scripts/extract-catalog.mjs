#!/usr/bin/env node
/**
 * Regenerate src/data/*.json from a legacy single-file HTML app (const RACKETS / STRINGS / …).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const src = path.join(ROOT, 'index.legacy.full.html');

if (!fs.existsSync(src)) {
  console.error(`Missing ${path.relative(ROOT, src)} — keep a copy of the monolith HTML at that path.`);
  process.exit(1);
}

const html = fs.readFileSync(src, 'utf8');
const lines = html.split('\n');

function parseJsonArrayConst(name, line) {
  const prefix = `const ${name} = `;
  if (!line.startsWith(prefix)) throw new Error(`Expected "${prefix}", got "${line.slice(0, 40)}…"`);
  const raw = line.slice(prefix.length).trim();
  const arrPart = raw.endsWith(';') ? raw.slice(0, -1) : raw;
  return JSON.parse(arrPart);
}

const racketLine = lines.find((l) => l.startsWith('const RACKETS = '));
const stringLine = lines.find((l) => l.startsWith('const STRINGS = '));
const dataDir = path.join(ROOT, 'src', 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(
  path.join(dataDir, 'rackets.json'),
  JSON.stringify(parseJsonArrayConst('RACKETS', racketLine), null, 2)
);
fs.writeFileSync(
  path.join(dataDir, 'strings.json'),
  JSON.stringify(parseJsonArrayConst('STRINGS', stringLine), null, 2)
);

function extractBlock(regex) {
  const m = html.match(regex);
  if (!m) throw new Error('Pattern miss: ' + regex);
  return m[1];
}

const comboBlock = extractBlock(/const ICONIC_COMBOS = (\[[\s\S]*?\]);/);
const iconic = new Function(`return (${comboBlock})`)();

const meta = {
  iconicCombos: iconic,
  twImg: new Function(`return (${extractBlock(/const TW_IMG = (\{[\s\S]*?\});/)})`)(),
  twPage: new Function(`return (${extractBlock(/const TW_PAGE = (\{[\s\S]*?\});/)})`)(),
  racketBlurbs: new Function(`return (${extractBlock(/const RACKET_BLURBS = (\{[\s\S]*?\n\});/)})`)(),
  brandColors: new Function(`return (${extractBlock(/const BRAND_COLORS = (\{[\s\S]*?\n\});/)})`)()
};

fs.writeFileSync(path.join(dataDir, 'meta.json'), JSON.stringify(meta, null, 2));
console.log('Wrote src/data/rackets.json, src/data/strings.json, src/data/meta.json from index.legacy.full.html');
