// Erzeugt die PWA-Icons aus einer SVG-Vorlage: node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";

const forest = "#303E34";
const paper = "#F8F7F3";
const terracotta = "#B96D52";

// «b.» – Kleinbuchstabe mit Terracotta-Punkt auf Waldgrün. maskable: mehr Innenabstand (Safe Zone 80 %).
function svg({ maskable }) {
  const scale = maskable ? 0.72 : 0.9;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${maskable ? 0 : 112}" fill="${forest}"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <path d="M170 110h46v108c18-22 44-34 76-34 66 0 108 50 108 118s-42 118-108 118c-33 0-60-13-77-36v30h-45V110zm116 118c-42 0-70 30-70 74s28 74 70 74 68-30 68-74-26-74-68-74z" fill="${paper}"/>
    <circle cx="420" cy="388" r="26" fill="${terracotta}"/>
  </g>
</svg>`;
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", svg({ maskable: false }));
const jobs = [
  ["public/icons/icon-192.png", 192, false],
  ["public/icons/icon-512.png", 512, false],
  ["public/icons/icon-maskable-512.png", 512, true],
  ["public/icons/apple-touch-icon.png", 180, true],
  ["src/app/icon.png", 64, false],
];
for (const [file, size, maskable] of jobs) {
  await sharp(Buffer.from(svg({ maskable }))).resize(size, size).png().toFile(file);
  console.log("✓", file);
}
