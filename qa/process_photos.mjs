import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const srcDir = 'D:/微信/xwechat_files/wxid_et1k5m9wkwcl22_2398/temp/RWTemp/2026-09/9e20f478899dc29eb19741386f9343c8/';
const outDir = 'D:/我的文档/Documents/ChatGPT/个人网站/src/content/photography/assets/';
mkdirSync(outDir, { recursive: true });

const photos = [
  ['8329be7195f921fec66489b26e2610aa.jpg', 'tiramisu.jpg'],
  ['93c83d32deb4695416565d75bdf97c3a.jpg', 'hana-remote.jpg'],
  ['12cf41dc151ac57483dd3973ff0a98d0.jpg', 'hiby-hd600.jpg'],
  ['82d8cdefe9a22a53f49092a8bf16bfd9.jpg', 'fried-noodles.jpg'],
  ['237c6d09fbc3bfdeeb0d0e8f0ceef054.jpg', 'park-shirt.jpg'],
  ['8f8944bd798e54677305dc8535fd8a1e.jpg', 'messi-live.jpg'],
  ['8b1d2ae74a5d6d932bbadb3256374ac4.jpg', 'city-waterfront.jpg'],
  ['914ff7fa631c3b3a723cc0844a44b64d.jpg', 'football-medals.jpg'],
  ['6191a668b454eaf5c915a02cc8b0527c.jpg', 'mirror-gown.jpg'],
  ['a08fdae1705adc525a1200406fb1c97d.jpg', 'outfit.jpg'],
];

for (const [src, dest] of photos) {
  const info = await sharp(srcDir + src).rotate().jpeg({ quality: 90 }).toFile(outDir + dest);
  console.log('processed', dest, info.width + 'x' + info.height);
}
console.log('done');
