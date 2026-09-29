import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const run = promisify(execFile);

const MANIFEST = 'dist/custom-elements.json';
const DEBOUNCE_MS = 200;

/**
 * Recursively sort object keys so two structurally equal manifests serialise
 * identically. `cem analyze` emits modules in a non-deterministic order — the
 * raw bytes differ on every run even with no source change — so without this
 * the change check below would fire on every save.
 */
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stable(nested)]),
    );
  }
  return value;
}

/**
 * Regenerate the custom-elements manifest while Storybook is running.
 *
 * The autodocs pages are driven by `dist/custom-elements.json`, which the
 * `predev` script generates once before Storybook starts. Editing a JSDoc
 * comment changes the component source but not that file, so the docs kept
 * showing stale descriptions until `npm run dev` was restarted.
 *
 * This watches the same sources `cem analyze` reads, re-runs it, and reloads
 * only when the generated manifest actually differs. That distinction matters:
 * the manifest captures the API surface and its docs, not implementation, so
 * ordinary code edits leave it byte-identical and keep Storybook's normal HMR
 * (which preserves story state) instead of forcing a page reload on every save.
 */
export function cemWatch(): Plugin {
  return {
    name: 'acorn:cem-watch',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root ?? process.cwd();
      const manifestPath = path.resolve(root, MANIFEST);

      const hash = async (): Promise<string | undefined> => {
        try {
          const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
          manifest.modules = (manifest.modules ?? []).sort(
            (a: { path?: string }, b: { path?: string }) =>
              (a.path ?? '').localeCompare(b.path ?? ''),
          );
          return createHash('sha1')
            .update(JSON.stringify(stable(manifest)))
            .digest('hex');
        } catch {
          return undefined;
        }
      };

      // Mirrors custom-elements-manifest.config.mjs: src/**/*.ts, minus
      // stories and generated output.
      const isAnalyzed = (file: string): boolean => {
        const rel = path.relative(root, file);
        if (rel.startsWith('..')) return false;
        if (!rel.startsWith(`src${path.sep}`)) return false;
        if (!rel.endsWith('.ts') || rel.endsWith('.stories.ts')) return false;
        return !rel.startsWith(`src${path.sep}generated${path.sep}`);
      };

      let timer: ReturnType<typeof setTimeout> | undefined;
      let running = false;
      let rerun = false;

      const analyze = async (): Promise<void> => {
        if (running) {
          // A save landed mid-run; the analyzer reads from disk, so just queue
          // one more pass rather than racing two writes to the same file.
          rerun = true;
          return;
        }
        running = true;
        try {
          const before = await hash();
          await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', [
            'run',
            'analyze',
          ]);
          const after = await hash();
          if (before === after) return;

          const module = server.moduleGraph.getModuleById(manifestPath);
          if (module) server.moduleGraph.invalidateModule(module);
          server.hot.send({ type: 'full-reload' });
          server.config.logger.info('[cem] manifest changed, docs reloaded');
        } catch (error) {
          // A syntax error mid-edit is expected; keep serving and let the next
          // save recover rather than tearing down the dev server.
          server.config.logger.warn(
            `[cem] analyze failed: ${error instanceof Error ? error.message : error}`,
          );
        } finally {
          running = false;
          if (rerun) {
            rerun = false;
            void analyze();
          }
        }
      };

      const schedule = (file: string): void => {
        if (!isAnalyzed(file)) return;
        clearTimeout(timer);
        timer = setTimeout(() => void analyze(), DEBOUNCE_MS);
      };

      server.watcher.on('change', schedule);
      server.watcher.on('add', schedule);
      server.watcher.on('unlink', schedule);
    },
  };
}
