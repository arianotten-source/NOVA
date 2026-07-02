#!/usr/bin/env node
/**
 * Generate all N.O.V.A. platform icons from branding SVG masters.
 * Run: npm run icons:generate
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import toIco from 'to-ico';
import png2icons from 'png2icons';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const branding = path.join(root, 'branding');
const publicDir = path.join(root, 'frontend', 'public');
const buildDir = path.join(root, 'build');
const iconsDir = path.join(publicDir, 'icons');
const androidDir = path.join(publicDir, 'android');

const SOURCES = {
  full: path.join(branding, 'nova-icon-full.svg'),
  foreground: path.join(branding, 'nova-icon-foreground.svg'),
  background: path.join(branding, 'nova-icon-background.svg'),
  monochrome: path.join(branding, 'nova-icon-monochrome.svg'),
};

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

async function rasterize(svgPath, size, outPath, round = false) {
  let pipeline = sharp(svgPath).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  if (round) {
    const mask = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
    );
    pipeline = pipeline.composite([{ input: await sharp(mask).png().toBuffer(), blend: 'dest-in' }]);
  }
  await pipeline.png().toFile(outPath);
}

async function main() {
  ensureDir(publicDir);
  ensureDir(iconsDir);
  ensureDir(buildDir);

  // Master copy
  fs.copyFileSync(SOURCES.full, path.join(branding, 'nova-icon-master.svg'));
  fs.copyFileSync(SOURCES.full, path.join(publicDir, 'nova-icon-master.svg'));
  fs.copyFileSync(SOURCES.foreground, path.join(publicDir, 'favicon.svg'));

  console.log('Generating PWA icons…');
  for (const size of PWA_SIZES) {
    await rasterize(SOURCES.full, size, path.join(iconsDir, `icon-${size}x${size}.png`));
  }

  console.log('Generating favicons…');
  const faviconBuffers = [];
  for (const size of FAVICON_SIZES) {
    const out = path.join(publicDir, `favicon-${size}x${size}.png`);
    await rasterize(SOURCES.full, size, out);
    faviconBuffers.push(await sharp(out).png().toBuffer());
  }
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), await toIco(faviconBuffers));

  console.log('Generating apple-touch-icon…');
  await rasterize(SOURCES.full, 180, path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating Android mipmap icons…');
  for (const [folder, size] of Object.entries(ANDROID_DENSITIES)) {
    const dir = path.join(androidDir, folder);
    ensureDir(dir);
    await rasterize(SOURCES.full, size, path.join(dir, 'ic_launcher.png'));
    await rasterize(SOURCES.full, size, path.join(dir, 'ic_launcher_round.png'), true);
    await rasterize(SOURCES.foreground, size, path.join(dir, 'ic_launcher_foreground.png'));
    await rasterize(SOURCES.background, size, path.join(dir, 'ic_launcher_background.png'));
    await rasterize(SOURCES.monochrome, size, path.join(dir, 'ic_launcher_monochrome.png'));
  }

  // Notification icon (white on transparent simplified — use monochrome scaled)
  await rasterize(SOURCES.monochrome, 96, path.join(publicDir, 'notification-icon.png'));

  console.log('Generating Electron / desktop icons…');
  await rasterize(SOURCES.full, 1024, path.join(buildDir, 'icon.png'));
  await rasterize(SOURCES.full, 512, path.join(publicDir, 'icon.png'));
  await rasterize(SOURCES.full, 256, path.join(publicDir, 'icon-256.png'));

  const masterPng = await sharp(path.join(buildDir, 'icon.png')).png().toBuffer();
  const icns = png2icons.createICNS(masterPng, png2icons.BILINEAR, 0);
  const ico = png2icons.createICO(masterPng, png2icons.BILINEAR, 0, false, true);
  if (icns) fs.writeFileSync(path.join(buildDir, 'icon.icns'), icns);
  if (ico) fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
  fs.copyFileSync(path.join(buildDir, 'icon.ico'), path.join(publicDir, 'icon.ico'));

  console.log('Done — icons written to frontend/public/ and build/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
