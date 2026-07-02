#!/usr/bin/env node
/**
 * Local-only icon pipeline. Never run during Vercel build (scripts/ is in .vercelignore).
 * Sources: assets/branding/ → fallback branding/
 * Outputs: frontend/public/, build/
 *
 * Run: npm run icons
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function resolveSource(fallbacks) {
  for (const rel of fallbacks) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const SOURCES = {
  full: resolveSource(['assets/branding/logo.svg', 'branding/nova-icon-full.svg']),
  foreground: resolveSource(['assets/branding/favicon.svg', 'branding/nova-icon-foreground.svg']),
  background: resolveSource(['branding/nova-icon-background.svg']),
  monochrome: resolveSource(['branding/nova-icon-monochrome.svg']),
};

const publicDir = path.join(root, 'frontend', 'public');
const buildDir = path.join(root, 'build');
const iconsDir = path.join(publicDir, 'icons');
const androidDir = path.join(publicDir, 'android');

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512, 1024];
const ANDROID_DENSITIES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};
const FAVICON_SIZES = [16, 32, 48];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function rasterize(sharp, svgPath, size, outPath, round = false) {
  let pipeline = sharp(svgPath).resize(size, size, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (round) {
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );
    pipeline = pipeline.composite([{ input: await sharp(mask).png().toBuffer(), blend: 'dest-in' }]);
  }
  await pipeline.png().toFile(outPath);
}

async function main() {
  if (!SOURCES.full) {
    console.warn('[icons] No source SVG found — keeping existing frontend/public icons.');
    process.exit(0);
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[icons] sharp not installed — using committed icons in frontend/public/.');
    process.exit(0);
  }

  let toIco;
  try {
    toIco = (await import('to-ico')).default;
  } catch {
    toIco = null;
  }

  let png2icons;
  try {
    png2icons = await import('png2icons');
  } catch {
    png2icons = null;
  }

  ensureDir(publicDir);
  ensureDir(iconsDir);
  ensureDir(buildDir);
  ensureDir(path.join(root, 'assets/branding'));

  fs.copyFileSync(SOURCES.full, path.join(publicDir, 'nova-icon-master.svg'));
  if (SOURCES.foreground) {
    fs.copyFileSync(SOURCES.foreground, path.join(publicDir, 'favicon.svg'));
  }

  console.log('Generating PWA icons…');
  for (const size of PWA_SIZES) {
    await rasterize(sharp, SOURCES.full, size, path.join(iconsDir, `icon-${size}x${size}.png`));
  }

  console.log('Generating favicons…');
  const faviconBuffers = [];
  for (const size of FAVICON_SIZES) {
    const out = path.join(publicDir, `favicon-${size}x${size}.png`);
    await rasterize(sharp, SOURCES.full, size, out);
    faviconBuffers.push(await sharp(out).png().toBuffer());
  }
  if (toIco && faviconBuffers.length) {
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), await toIco(faviconBuffers));
  }

  await rasterize(sharp, SOURCES.full, 180, path.join(publicDir, 'apple-touch-icon.png'));

  if (SOURCES.foreground && SOURCES.background && SOURCES.monochrome) {
    console.log('Generating Android mipmap icons…');
    for (const [folder, size] of Object.entries(ANDROID_DENSITIES)) {
      const dir = path.join(androidDir, folder);
      ensureDir(dir);
      await rasterize(sharp, SOURCES.full, size, path.join(dir, 'ic_launcher.png'));
      await rasterize(sharp, SOURCES.full, size, path.join(dir, 'ic_launcher_round.png'), true);
      await rasterize(sharp, SOURCES.foreground, size, path.join(dir, 'ic_launcher_foreground.png'));
      await rasterize(sharp, SOURCES.background, size, path.join(dir, 'ic_launcher_background.png'));
      await rasterize(sharp, SOURCES.monochrome, size, path.join(dir, 'ic_launcher_monochrome.png'));
    }
    await rasterize(sharp, SOURCES.monochrome, 96, path.join(publicDir, 'notification-icon.png'));
  }

  console.log('Generating Electron / desktop icons…');
  await rasterize(sharp, SOURCES.full, 1024, path.join(buildDir, 'icon.png'));
  await rasterize(sharp, SOURCES.full, 512, path.join(publicDir, 'icon.png'));
  await rasterize(sharp, SOURCES.full, 256, path.join(publicDir, 'icon-256.png'));
  fs.copyFileSync(path.join(buildDir, 'icon.png'), path.join(root, 'assets/branding/app-icon.png'));

  if (png2icons) {
    const masterPng = await sharp(path.join(buildDir, 'icon.png')).png().toBuffer();
    const icns = png2icons.createICNS(masterPng, png2icons.BILINEAR, 0);
    const ico = png2icons.createICO(masterPng, png2icons.BILINEAR, 0, false, true);
    if (icns) fs.writeFileSync(path.join(buildDir, 'icon.icns'), icns);
    if (ico) {
      fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
      fs.copyFileSync(path.join(buildDir, 'icon.ico'), path.join(publicDir, 'icon.ico'));
    }
  }

  console.log('Done — icons written to frontend/public/ and build/');
}

main().catch((err) => {
  console.error('[icons] generation failed:', err.message);
  console.warn('[icons] Deployments use committed icons — this is non-fatal.');
  process.exit(0);
});
