/**
 * generate-image-manifest.cjs
 *
 * Scans public/images/umkm/ and generates src/data/image-manifest.json
 * mapping each UMKM number to its available images.
 *
 * Run: node scripts/generate-image-manifest.cjs
 * Auto-runs via "prebuild" script in package.json.
 */
const fs = require('fs');
const path = require('path');

const UMKM_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'umkm');
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'data', 'image-manifest.json');

function generateManifest() {
  const manifest = {};

  // Ensure the images directory exists
  if (!fs.existsSync(UMKM_IMAGES_DIR)) {
    fs.mkdirSync(UMKM_IMAGES_DIR, { recursive: true });
    console.log('📁 Created directory: public/images/umkm/');
  }

  const entries = fs.readdirSync(UMKM_IMAGES_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const folderName = entry.name;
    // Only process numeric folder names
    if (!/^\d+$/.test(folderName)) continue;

    const folderPath = path.join(UMKM_IMAGES_DIR, folderName);
    const files = fs.readdirSync(folderPath);

    const hasCover = files.some(
      (f) => f.toLowerCase() === 'cover.webp'
    );

    // Gallery images: 1.webp, 2.webp, 3.webp, etc.
    const gallery = [];
    for (const file of files) {
      const match = file.match(/^(\d+)\.webp$/i);
      if (match) {
        gallery.push(parseInt(match[1], 10));
      }
    }
    gallery.sort((a, b) => a - b);

    // Only add to manifest if folder has actual images
    if (hasCover || gallery.length > 0) {
      manifest[folderName] = {
        cover: hasCover,
        gallery,
      };
    }
  }

  // Ensure output directory exists
  const manifestDir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  const count = Object.keys(manifest).length;
  console.log(`✅ Image manifest generated: ${count} UMKM with images`);
  console.log(`   → ${MANIFEST_PATH}`);
}

generateManifest();
