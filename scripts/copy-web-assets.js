import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const webOutput = join(projectRoot, 'www');
const webAssets = [
  'index.html',
  'escape.html',
  'style.css',
  'underside.css',
  'script.js',
  'haunting-fallback.js',
  'gsap.min.js',
  'assets',
  'audio',
  'images',
  'js',
  'videos'
];

for (const asset of webAssets) {
  const source = join(projectRoot, asset);
  if (!existsSync(source)) {
    throw new Error(`Required web asset is missing: ${asset}`);
  }
}

mkdirSync(webOutput, { recursive: true });

for (const asset of webAssets) {
  cpSync(join(projectRoot, asset), join(webOutput, asset), { recursive: true });
}

console.log(`Copied ${webAssets.length} web asset groups to www/.`);
