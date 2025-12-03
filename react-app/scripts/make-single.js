import fs from 'fs';
import path from 'path';

const distDir = path.resolve(new URL('.', import.meta.url).pathname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');

function inlineAsset(html, tag, assetPath, wrapTag) {
  if (!assetPath) return html;
  const absPath = path.join(distDir, assetPath.replace(/^\//, ''));
  const content = fs.readFileSync(absPath, 'utf8');
  const replacement = wrapTag(content);
  return html.replace(tag, replacement);
}

function run() {
  if (!fs.existsSync(htmlPath)) {
    throw new Error('dist/index.html not found. Run "npm run build" first.');
  }
  let html = fs.readFileSync(htmlPath, 'utf8');

  const cssMatch = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
  if (cssMatch) {
    const [tag, href] = cssMatch;
    html = inlineAsset(html, tag, href, (content) => `<style>${content}</style>`);
  }

  const jsMatch = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
  if (jsMatch) {
    const [tag, src] = jsMatch;
    html = inlineAsset(html, tag, src, (content) => `<script type="module">${content}</script>`);
  }

  const outPath = path.join(distDir, 'app.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Single-file bundle written to ${outPath}`);
}

run();
