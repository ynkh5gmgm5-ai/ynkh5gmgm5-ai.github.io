import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { publicationDirectory } from './config.ts';

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const vault = argument('--vault') ?? process.env.OBSIDIAN_VAULT_PATH;
  if (!vault) throw new Error('缺少 Vault 路径。');
  const directory = path.join(path.resolve(vault), publicationDirectory, '行业研究');
  const allFiles = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort();
  const selectedIndex = Number(argument('--index'));
  const files = Number.isInteger(selectedIndex) ? allFiles.slice(selectedIndex, selectedIndex + 1) : allFiles;
  const headLines = Number(argument('--head-lines') ?? 0);

  for (const file of files) {
    const parsed = matter(await readFile(path.join(directory, file), 'utf8'));
    const lines = parsed.content.split(/\r?\n/);
    const excerpts: string[] = [];
    let remainingAfterHeading = 0;
    for (const line of lines) {
      if (/^#{1,3}\s/.test(line)) {
        excerpts.push(line);
        remainingAfterHeading = 5;
        continue;
      }
      if (remainingAfterHeading > 0 && line.trim()) {
        excerpts.push(line);
        remainingAfterHeading -= 1;
      }
    }
    process.stdout.write(`\n===== ${file} =====\n`);
    process.stdout.write(`${JSON.stringify(parsed.data, null, 2)}\n`);
    if (headLines > 0) process.stdout.write(`${lines.slice(0, headLines).join('\n')}\n`);
    process.stdout.write(`${excerpts.join('\n')}\n`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
