import cors from "cors";
import express from "express";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { scanRepository } from "../../analyzer/src/index.js";

const execFileAsync = promisify(execFile);

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/", (_request, response) => {
  response.send("CodeAtlas API is running");
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "CodeAtlas API" });
});

app.post("/api/analyze", async (request, response) => {
  const repositoryPath = request.body?.repositoryPath;
  if (typeof repositoryPath !== "string" || repositoryPath.trim() === "") {
    response.status(400).json({ error: "repositoryPath is required" });
    return;
  }
  let temporaryRepository: string | undefined;
  try {
    let scanPath = repositoryPath.trim();
    if (/^https?:\/\/github\.com\//i.test(scanPath)) {
      const match = scanPath.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?\/?(?:[#?].*)?$/i);
      if (!match) throw new Error("Enter a valid public GitHub URL, such as https://github.com/user/repository");
      temporaryRepository = await mkdtemp(path.join(os.tmpdir(), "codeatlas-"));
      const cloneTarget = path.join(temporaryRepository, "repository");
      await execFileAsync("git", ["clone", "--depth", "1", `https://github.com/${match[1]}/${match[2]}.git`, cloneTarget], { timeout: 120000 });
      scanPath = cloneTarget;
    } else if (/^https?:\/\//i.test(scanPath)) {
      throw new Error("Only local folders and public GitHub URLs are supported");
    }
    const files = await scanRepository(scanPath);
    response.json({ files, totalFiles: files.length });
  } catch (error) {
    response.status(400).json({ error: error instanceof Error ? error.message : "Unable to scan repository" });
  } finally {
    if (temporaryRepository) await rm(temporaryRepository, { recursive: true, force: true });
  }
});

app.listen(port, () => {
  console.log(`CodeAtlas API listening on http://localhost:${port}`);
});
