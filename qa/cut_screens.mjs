import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.argv[2] || 'C:/Users/Administrator/AppData/Local/Temp/vision_check';
const files = readdirSync(DIR).filter(f => f.endsWith('.png'));
const SEG = 900; // 每段高度

for (const f of files) {
  const full = join(DIR, f);
  const meta = await sharp(full).metadata();
  if (meta.height <= SEG) continue;
  const name = f.replace('.png', '');
  const n = Math.ceil(meta.height / SEG);
  for (let i = 0; i < n; i++) {
    await sharp(full)
      .extract({ left: 0, top: i * SEG, width: meta.width, height: Math.min(SEG, meta.height - i * SEG) })
      .png()
      .toFile(join(DIR, `${name}_seg${i + 1}.png`));
  }
  console.log('cut', f, '->', n, 'segments, size', meta.width, 'x', meta.height);
}
