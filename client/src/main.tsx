import { FormEvent, StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [apiStatus, setApiStatus] = useState("Connecting to API…");
  const [repositoryPath, setRepositoryPath] = useState("");
  const [files, setFiles] = useState<{ path: string; extension: string; size: number }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then((response) => response.json())
      .then(() => setApiStatus("API connected"))
      .catch(() => setApiStatus("API unavailable"));
  }, []);

  async function analyze(event: FormEvent) {
    event.preventDefault(); setError("");
    try {
      const response = await fetch("http://localhost:3001/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ repositoryPath }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setFiles(result.files);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Analysis failed"); }
  }

  return <main><p className="eyebrow">Developer architecture explorer</p><h1>CodeAtlas</h1><p className="intro">Turn a codebase into an interactive map of how its pieces connect.</p><div className="status"><span />{apiStatus}</div><section><h2>Analyze a repository</h2><form onSubmit={analyze}><input value={repositoryPath} onChange={(event) => setRepositoryPath(event.target.value)} placeholder="Local folder or public GitHub URL" aria-label="Repository location" /><button type="submit">Analyze repository</button></form>{error && <p className="error">{error}</p>}<p className="count">Files analyzed: {files.length}</p>{files.length > 0 && <ul>{files.map((file) => <li key={file.path}><code>{file.path}</code><small>{file.extension} · {file.size} bytes</small></li>)}</ul>}</section></main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
