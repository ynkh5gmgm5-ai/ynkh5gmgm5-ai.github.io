import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { publicationDirectory } from './config.ts';

const researchFiles = [
  '中国Hi-Fi新用户增长与PC装机渠道拓展策略.md',
  'HiFi街头试听营销方案.md',
  '山灵主推SKU与用户定位表.md',
  '国内HiFi竞品与价格带地图.md',
  'HiFi渠道角色与进入策略.md',
  '用户需求差评与新品机会清单.md',
] as const;

const publicationDirectories = [
  '行业研究',
  path.join('试听档案', '大耳'),
  path.join('试听档案', '入耳'),
  path.join('试听档案', '闪击探店与展会蹭听'),
  '摄影',
  '关于',
] as const;

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const vaultArgument = argument('--vault') ?? process.env.OBSIDIAN_VAULT_PATH;
  const dryRun = process.argv.includes('--dry-run');
  if (!vaultArgument) throw new Error('请通过 `--vault <路径>` 或 `OBSIDIAN_VAULT_PATH` 指定 Vault。');

  const vaultRoot = path.resolve(vaultArgument);
  const publicationRoot = path.join(vaultRoot, publicationDirectory);
  const plannedDirectories = publicationDirectories.map((directory) => path.join(publicationRoot, directory));
  const plannedFiles: Array<{ source: string; destination: string; content: string }> = [];

  for (const fileName of researchFiles) {
    const source = path.join(vaultRoot, fileName);
    const destination = path.join(publicationRoot, '行业研究', fileName);
    if (!(await exists(source))) throw new Error(`源笔记不存在：${source}`);

    const parsed = matter(await readFile(source, 'utf8'));
    const content = matter.stringify(parsed.content.trimStart(), { ...parsed.data, publish: false });

    if (await exists(destination)) {
      const existing = await readFile(destination, 'utf8');
      if (existing !== content) throw new Error(`目标笔记已存在且内容不同，不会覆盖：${destination}`);
      continue;
    }
    plannedFiles.push({ source, destination, content });
  }

  if (!dryRun) {
    for (const directory of plannedDirectories) await mkdir(directory, { recursive: true });
    for (const file of plannedFiles) await writeFile(file.destination, file.content, { encoding: 'utf8', flag: 'wx' });
  }

  process.stdout.write(`${JSON.stringify({
    mode: dryRun ? 'dry-run' : 'write',
    publicationRoot,
    directories: plannedDirectories.map((directory) => path.relative(vaultRoot, directory)),
    copiedFiles: plannedFiles.map((file) => path.relative(vaultRoot, file.destination)),
    skippedExisting: researchFiles.length - plannedFiles.length,
    publishDefault: false,
  }, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`发布区建立失败：${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
