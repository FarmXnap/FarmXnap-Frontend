// Run: node generate-icons.js
// Requires: npm install -D sharp

import sharp from 'sharp'
import { readFileSync } from 'fs'

const src = readFileSync('./public/icon-source.svg')

const icons = [
  // PWA standard icons
  { file: 'pwa-192x192.png',         size: 192 },
  { file: 'pwa-512x512.png',         size: 512 },
  // Maskable (safe zone = 80% of canvas = leave 10% padding each side)
  { file: 'pwa-maskable-512x512.png', size: 512, maskable: true },
  // Favicon sizes
  { file: 'favicon-32x32.png',       size: 32  },
  { file: 'favicon-16x16.png',       size: 16  },
  // Apple touch icon
  { file: 'apple-touch-icon.png',    size: 180 },
]

for (const { file, size, maskable } of icons) {
  let pipeline = sharp(src, { density: 300 })

  if (maskable) {
    // Maskable: resize to 80% of canvas, place on solid bg
    const innerSize = Math.round(size * 0.8)
    const offset    = Math.round(size * 0.1)
    const resized   = await sharp(src, { density: 300 })
      .resize(innerSize, innerSize)
      .toBuffer()
    pipeline = sharp({
      create: { width: size, height: size, channels: 4, background: '#060f08' }
    }).composite([{ input: resized, top: offset, left: offset }])
  } else {
    pipeline = pipeline.resize(size, size)
  }

  await pipeline.png().toFile(`./public/${file}`)
  console.log(`✓ ${file}`)
}

// favicon.svg — copy icon-source.svg (already in public/)
import { copyFileSync, existsSync } from 'fs'
const faviconSrc = existsSync('./public/logo.svg') ? './public/logo.svg' : './public/icon-source.svg'
copyFileSync(faviconSrc, './public/favicon.svg')
console.log('✓ favicon.svg')

console.log('\nAll icons generated! 🌿')