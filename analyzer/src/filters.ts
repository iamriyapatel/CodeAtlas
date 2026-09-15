import path from "node:path";

const supportedExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);
const ignoredDirectories = new Set(["node_modules", ".git", "dist", "build", "coverage"]);

export function shouldAnalyze(filePath: string): boolean {
  const parts = filePath.split(/[\\/]+/);
  const name = path.basename(filePath);
  return !parts.some((part) => ignoredDirectories.has(part)) &&
    !name.match(/^\.env(?:\..*)?$/) && supportedExtensions.has(path.extname(filePath).toLowerCase());
}

export function isIgnoredDirectory(directoryName: string): boolean {
  return ignoredDirectories.has(directoryName);
}
