// Packages the game into dist/greens-web.zip — a self-contained static build
// ready to upload to itch.io (HTML5), Netlify, GitHub Pages, or any web host.
// Run: npm run dist
import JSZip from 'jszip';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INCLUDE = ['index.html', 'src'];   // everything the game needs at runtime
const zip = new JSZip();

async function addPath(p) {
  const abs = join(ROOT, p);
  const info = await stat(abs);
  if (info.isDirectory()) {
    for (const entry of await readdir(abs)) await addPath(join(p, entry));
  } else {
    const data = await readFile(abs);
    zip.file(p.split('\\').join('/'), data);
    return data.length;
  }
}

let count = 0;
for (const p of INCLUDE) await addPath(p);
zip.forEach(() => count++);

const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
await mkdir(join(ROOT, 'dist'), { recursive: true });
await writeFile(join(ROOT, 'dist', 'greens-web.zip'), buf);

console.log(`\n  ✅ Built dist/greens-web.zip  (${count} files, ${(buf.length / 1024).toFixed(0)} KB)`);
console.log('  → Upload this zip to itch.io as an HTML5 game (tick "This file will be played in the browser").');
console.log('  → index.html is at the zip root, so it just works.\n');
