// Capture les pages d'accueil des sites listés dans sites.json, puis régénère la grille de public/index.html.
// Usage : node scripts/update.mjs              (captures + grille)
//         node scripts/update.mjs --render-only (grille seule, sans navigateur)
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const CAP = path.join(PUB, 'img', 'captures');
const sites = JSON.parse(await readFile(path.join(ROOT, 'sites.json'), 'utf8'));
const renderOnly = process.argv.includes('--render-only');
const exists = p => access(p).then(() => true, () => false);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function capture() {
  const { chromium } = await import('playwright');
  const sharp = (await import('sharp')).default;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'fr-FR' });
  await mkdir(CAP, { recursive: true });
  const ok = [];
  for (const s of sites) {
    const page = await ctx.newPage();
    try {
      await page.goto(s.captureUrl || s.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(2500);
      const png = await page.screenshot({ type: 'png' });
      await sharp(png).resize(1200, 750, { fit: 'cover', position: 'top' }).webp({ quality: 80 }).toFile(path.join(CAP, `${s.slug}.webp`));
      ok.push(s.slug);
      console.log(`OK   ${s.slug}`);
    } catch (e) {
      console.warn(`ECHEC ${s.slug} (${s.captureUrl || s.url}) : ${e.message.split('\n')[0]} - capture précédente conservée`);
    } finally { await page.close(); }
  }
  await browser.close();

  // Image Open Graph : mosaïque 2x2 des quatre premières captures disponibles
  const tiles = [];
  for (const s of sites) { const f = path.join(CAP, `${s.slug}.webp`); if (await exists(f)) tiles.push(f); if (tiles.length === 4) break; }
  if (tiles.length === 4) {
    const parts = await Promise.all(tiles.map(f => sharp(f).resize(596, 311, { fit: 'cover', position: 'top' }).toBuffer()));
    await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#1c2340' } })
      .composite(parts.map((input, i) => ({ input, left: (i % 2) * 604, top: Math.floor(i / 2) * 319 })))
      .webp({ quality: 80 }).toFile(path.join(PUB, 'img', 'og.webp'));
  }
  return ok;
}

async function render() {
  const items = [];
  for (const [i, s] of sites.entries()) {
    const n = String(i + 1).padStart(2, '0');
    const domain = new URL(s.url).hostname.replace(/^www\./, '');
    const hasImg = await exists(path.join(CAP, `${s.slug}.webp`));
    const shot = hasImg
      ? `<figure class="shot"><img src="/img/captures/${s.slug}.webp" alt="Page d'accueil du site ${esc(s.title)}" width="1200" height="750" loading="${i < 3 ? 'eager' : 'lazy'}"></figure>`
      : `<figure class="shot empty" aria-hidden="true">${esc(s.title)}</figure>`;
    items.push(`      <li class="card"><a href="${esc(s.url)}" target="_blank" rel="noopener">
        ${shot}
        <div class="body"><div class="meta"><span class="cat">${esc(s.category)}</span><span>${n}</span></div>
        <h2>${esc(s.title)}</h2><p>${esc(s.description)}</p><span class="domain">${esc(domain)} ↗</span></div>
      </a></li>`);
  }
  const grid = `<!-- GRID:START -->\n    <ul class="grid">\n${items.join('\n')}\n    </ul>\n    <!-- GRID:END -->`;
  const indexPath = path.join(PUB, 'index.html');
  let html = await readFile(indexPath, 'utf8');
  html = html.replace(/<!-- GRID:START -->[\s\S]*?<!-- GRID:END -->/, grid);
  if (!renderOnly) {
    const d = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
    html = html.replace(/<!-- UPDATED:START -->[\s\S]*?<!-- UPDATED:END -->/, `<!-- UPDATED:START -->Captures d'écran actualisées automatiquement chaque semaine - dernière mise à jour le ${d}.<!-- UPDATED:END -->`);
  }
  await writeFile(indexPath, html);
}

if (!renderOnly) await capture();
await render();
console.log(`Grille régénérée : ${sites.length} projets.`);
