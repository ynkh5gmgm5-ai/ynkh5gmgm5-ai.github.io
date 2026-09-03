import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const srcDir = 'D:/微信/xwechat_files/wxid_et1k5m9wkwcl22_2398/temp/RWTemp/2026-09/9e20f478899dc29eb19741386f9343c8/';
const notesDir = 'D:/我的文档/Documents/ChatGPT/个人网站/src/content/field-notes/assets/';
const heroDir = 'D:/我的文档/Documents/ChatGPT/个人网站/src/assets/';
mkdirSync(notesDir, { recursive: true });
mkdirSync(heroDir, { recursive: true });

const notes = [
  ['fea148b44b48448a622cda8f437b5802.jpg', 'chongqing-live-stream.jpg'],
  ['bfc632f97235fae875ab94b6a8da1bd2.jpg', 'chongqing-group.jpg'],
  ['2de08c5bddcbadeab71ea5afb751c6d1.jpg', 'chongqing-selfie.jpg'],
  ['9c1aafb0350d1cea1a6bc686b3a73e2a.jpg', 'changsha-poster.jpg'],
];

for (const [src, dest] of notes) {
  const info = await sharp(srcDir + src).rotate().jpeg({ quality: 90 }).toFile(notesDir + dest);
  console.log('note', dest, info.width + 'x' + info.height);
}

// hero 背景：最后一张（薯条自拍），去 EXIF
const hero = await sharp(srcDir + 'cfff6324d9b90ab6cb245c357eb71d74.jpg')
  .rotate()
  .jpeg({ quality: 88 })
  .toFile(heroDir + 'hero-background.jpg');
console.log('hero', 'hero-background.jpg', hero.width + 'x' + hero.height);
console.log('done');
