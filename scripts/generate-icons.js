import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Standard SVG Icon (512x512)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E5C9" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997A1E" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="54%" r="45%">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#0D0D0E" stop-opacity="0" />
    </radialGradient>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded squircle / card -->
  <rect width="512" height="512" rx="112" fill="#0D0D0E" />
  <rect x="12" y="12" width="488" height="488" rx="100" fill="#141416" stroke="#2A2A2C" stroke-width="4" />
  
  <!-- Subtle radial ambient glow -->
  <circle cx="256" cy="276" r="200" fill="url(#glowGrad)" />

  <!-- Outer Stopwatch dial ring -->
  <g filter="url(#goldGlow)">
    <!-- Top Button Header -->
    <line x1="216" y1="64" x2="296" y2="64" stroke="url(#goldGrad)" stroke-width="28" stroke-linecap="round" />
    <line x1="256" y1="64" x2="256" y2="114" stroke="url(#goldGrad)" stroke-width="22" stroke-linecap="round" />

    <!-- Top right angled button -->
    <line x1="376" y1="126" x2="416" y2="166" stroke="url(#goldGrad)" stroke-width="18" stroke-linecap="round" />

    <!-- Circular Clock Body -->
    <circle cx="256" cy="300" r="162" fill="#1A1A1C" stroke="url(#goldGrad)" stroke-width="26" />
    
    <!-- Inner dial border -->
    <circle cx="256" cy="300" r="140" fill="none" stroke="#2A2A2C" stroke-width="3" />

    <!-- Clock Center Pivot -->
    <circle cx="256" cy="300" r="14" fill="url(#goldGrad)" />

    <!-- Clock Hands (Pointing forward) -->
    <!-- Hour Hand -->
    <line x1="256" y1="300" x2="256" y2="200" stroke="url(#goldGrad)" stroke-width="18" stroke-linecap="round" />
    <!-- Minute Hand -->
    <line x1="256" y1="300" x2="330" y2="236" stroke="url(#goldGrad)" stroke-width="14" stroke-linecap="round" />

    <!-- Clock Hour Ticks -->
    <circle cx="256" cy="166" r="5" fill="#D4AF37" />
    <circle cx="390" cy="300" r="5" fill="#D4AF37" />
    <circle cx="256" cy="434" r="5" fill="#D4AF37" />
    <circle cx="122" cy="300" r="5" fill="#D4AF37" />
  </g>
</svg>`;

// 2. Maskable SVG Icon (Safe zone margin for Android squircles/circles)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F5E5C9" />
      <stop offset="50%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#997A1E" />
    </linearGradient>
    <radialGradient id="glowGradM" cx="50%" cy="50%" r="45%">
      <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#0D0D0E" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Full bleed solid background for maskable compliance -->
  <rect width="512" height="512" fill="#0D0D0E" />
  <circle cx="256" cy="256" r="230" fill="#141416" />
  <circle cx="256" cy="265" r="180" fill="url(#glowGradM)" />

  <!-- Scaled inside 80% safe zone (center 0.78 scale) -->
  <g transform="translate(256, 260) scale(0.72) translate(-256, -280)">
    <!-- Top Button Header -->
    <line x1="216" y1="64" x2="296" y2="64" stroke="url(#goldGradM)" stroke-width="28" stroke-linecap="round" />
    <line x1="256" y1="64" x2="256" y2="114" stroke="url(#goldGradM)" stroke-width="22" stroke-linecap="round" />
    <line x1="376" y1="126" x2="416" y2="166" stroke="url(#goldGradM)" stroke-width="18" stroke-linecap="round" />

    <!-- Circular Clock Body -->
    <circle cx="256" cy="300" r="162" fill="#1A1A1C" stroke="url(#goldGradM)" stroke-width="26" />
    <circle cx="256" cy="300" r="140" fill="none" stroke="#2A2A2C" stroke-width="3" />

    <!-- Center Pivot -->
    <circle cx="256" cy="300" r="14" fill="url(#goldGradM)" />

    <!-- Hands -->
    <line x1="256" y1="300" x2="256" y2="200" stroke="url(#goldGradM)" stroke-width="18" stroke-linecap="round" />
    <line x1="256" y1="300" x2="330" y2="236" stroke="url(#goldGradM)" stroke-width="14" stroke-linecap="round" />

    <!-- Ticks -->
    <circle cx="256" cy="166" r="5" fill="#D4AF37" />
    <circle cx="390" cy="300" r="5" fill="#D4AF37" />
    <circle cx="256" cy="434" r="5" fill="#D4AF37" />
    <circle cx="122" cy="300" r="5" fill="#D4AF37" />
  </g>
</svg>`;

async function generate() {
  console.log('Generating PWA icons...');
  
  // Write SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

  // Generate PNGs using Sharp
  const svgBuffer = Buffer.from(svgIcon);
  const maskableBuffer = Buffer.from(svgMaskable);

  // 192x192
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created pwa-192x192.png');

  // 512x512
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created pwa-512x512.png');

  // 512x512 maskable
  await sharp(maskableBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created pwa-maskable-512x512.png');

  // 180x180 Apple Touch Icon
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // 32x32 favicon
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico');

  console.log('All PWA icons generated successfully!');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
