// Simple icon generator script
// Run with: node generate-icons.js

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a simple SVG icon
const createSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#45a049;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.125}"/>
  <text x="50%" y="50%" font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">💪</text>
</svg>
`.trim();

// Write SVG files (browsers can use SVG as icons)
const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createSVG(size);
  const filename = join(__dirname, 'public', `icon-${size}x${size}.svg`);
  writeFileSync(filename, svg);
  console.log(`Created ${filename}`);
});

// Also create a favicon
const favicon = createSVG(32);
writeFileSync(join(__dirname, 'public', 'favicon.svg'), favicon);
console.log('Created public/favicon.svg');

console.log('\n✓ Icons generated successfully!');
console.log('Note: For best compatibility, convert SVG to PNG using an online tool or image editor.');
