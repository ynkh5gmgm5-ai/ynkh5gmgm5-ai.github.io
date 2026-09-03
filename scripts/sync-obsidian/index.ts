import path from 'node:path';
import { buildSyncPlan, executeSyncPlan } from './sync.ts';

function readArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const vaultRoot = readArgument('--vault') ?? process.env.OBSIDIAN_VAULT_PATH;
  const projectRoot = path.resolve(readArgument('--project') ?? process.cwd());
  const dryRun = process.argv.includes('--dry-run');
  const production = process.argv.includes('--production');

  if (!vaultRoot) {
    throw new Error('请通过 `--vault <路径>` 或 `OBSIDIAN_VAULT_PATH` 指定 Obsidian Vault。');
  }

  const plan = await buildSyncPlan({ vaultRoot, projectRoot, production });
  if (!dryRun) await executeSyncPlan(plan);

  const result = {
    mode: dryRun ? 'dry-run' : production ? 'production' : 'preview',
    syncedNotes: plan.syncedNotes,
    copiedAssets: plan.operations.filter((operation) => operation.kind === 'copy').length,
    staleFiles: plan.staleFiles.map((file) => path.relative(projectRoot, file)),
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Obsidian 同步失败：${message}\n`);
  process.exitCode = 1;
});
