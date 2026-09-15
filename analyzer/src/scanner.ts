import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { isIgnoredDirectory, shouldAnalyze } from "./filters.js";
import type { SourceFile } from "./types.js";

export async function scanRepository(repositoryPath: string): Promise<SourceFile[]> {
  const root = path.resolve(repositoryPath);
  const files: SourceFile[] = [];

  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && !isIgnoredDirectory(entry.name)) {
        await visit(path.join(directory, entry.name));
      } else if (entry.isFile()) {
        const absolutePath = path.join(directory, entry.name);
        if (shouldAnalyze(path.relative(root, absolutePath))) {
          const details = await stat(absolutePath);
          files.push({ path: path.relative(root, absolutePath).replaceAll(path.sep, "/"), extension: path.extname(entry.name).toLowerCase(), size: details.size });
        }
      }
    }
  }

  await visit(root);
  return files.sort((a, b) => a.path.localeCompare(b.path));
}
