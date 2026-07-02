#!/usr/bin/env node
/**
 * Local-only splash asset generator.
 * Run: npm run splash
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const source =
  [path.join(root, 'assets/branding/logo.svg'), path.join(root, 'branding/nova-icon-full.svg')].find(
    (p) => fs.existsSync(p)
  ) ?? null;

async function main() {
  if (!source) {
    console.warn('[splash] No logo SVG — skipping.');
    process.exit(0);
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[splash] sharp not installed — skipping.');
    process.exit(0);
  }

  const outAssets = path.join(root, 'assets/branding/splash.png');
  const outPublic = path.join(root, 'frontend/public/splash.png');
  const w = 1280;
  const h = 720;

  const avatarSize = 420;
  const avatar = await sharp(source)
    .resize(avatarSize, avatarSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const bg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#0f1f42"/>
          <stop offset="50%" stop-color="#060a14"/>
          <stop offset="100%" stop-color="#030508"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
    </svg>`
  );

  await sharp(bg)
    .composite([{ input: avatar, gravity: 'center' }])
    .png()
    .toFile(outAssets);

  fs.copyFileSync(outAssets, outPublic);
  console.log('[splash] Written to assets/branding/splash.png and frontend/public/splash.png');
}

main().catch((err) => {
  console.warn('[splash] failed:', err.message);
  process.exit(0);
});
