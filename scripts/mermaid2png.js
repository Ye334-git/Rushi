/**
 * Convert Mermaid flowchart to PNG via mermaid.ink with gzip compression.
 * Usage: node scripts/mermaid2png.js [source.md] [output.png]
 *   Default source: user_flow.md
 *   Default output: rushi_user_flow.png
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const srcFile = process.argv[2] || 'user_flow.md';
const outFile = process.argv[3] || 'rushi_user_flow.png';

const mdPath = path.join(__dirname, '..', srcFile);
const outputPath = path.join(__dirname, '..', outFile);

// ── Read mermaid code ──
const mdContent = fs.readFileSync(mdPath, 'utf-8');
const match = mdContent.match(/```mermaid\n([\s\S]*?)```/);
if (!match) { console.error('No mermaid block found in', srcFile); process.exit(1); }

const mermaidCode = match[1].trim();

// ── gzip + base64 for mermaid.ink pako format ──
const jsonPayload = JSON.stringify({ code: mermaidCode, mermaid: { theme: 'default' } });
const compressed = zlib.gzipSync(Buffer.from(jsonPayload, 'utf-8'));
const encoded = compressed.toString('base64url');

const url = `https://mermaid.ink/img/pako:${encoded}?type=png`;
console.log(`Source: ${srcFile} (${mermaidCode.length} chars)`);
console.log(`Compressed URL: ${url.length} chars`);
console.log('Fetching from mermaid.ink...');

// ── Download ──
function fetchURL(u, redirects) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    const proto = u.startsWith('https') ? https : require('http');
    proto.get(u, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchURL(res.headers.location, redirects + 1).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 300)}`)));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(outputPath, buf);
        resolve(outputPath);
      });
    }).on('error', reject);
  });
}

fetchURL(url, 0)
  .then(fp => console.log(`Done! Saved: ${fp} (${fs.statSync(fp).size} bytes)`))
  .catch(err => { console.error('Failed:', err.message); process.exit(1); });
