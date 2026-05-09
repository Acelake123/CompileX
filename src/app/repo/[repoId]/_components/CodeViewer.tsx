"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Code, Loader2, X } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { useRepoExplorer } from "../_context/RepoContext";

function detectLanguageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    rb: "ruby",
    go: "go",
    rs: "rust",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    php: "php",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    md: "markdown",
    txt: "plaintext",
    sh: "bash",
  };
  return map[ext] || "plaintext";
}

export default function CodeViewer() {
  const {
    repoData,
    selectedNode,
    setSelectedNode,
    selectedFileContent,
    setSelectedFileContent,
    setIsFileLoading,
  } = useRepoExplorer();
  const [isLoading, setIsLoading] = useState(false);
  const fetchAndCache = useAction(api.repositoryActions.fetchAndCacheFileContent);

  const repositoryId = repoData.repositoryId;

  useEffect(() => {
    const loadFile = async () => {
      if (!selectedNode || selectedNode.type !== "file") {
        setSelectedFileContent(null);
        setIsFileLoading(false);
        return;
      }
      if (!repositoryId) {
        setSelectedFileContent(null);
        setIsFileLoading(false);
        return;
      }

      setIsLoading(true);
      setIsFileLoading(true);
      try {
        const cached = await fetchAndCache({
          repositoryId: repositoryId as Id<"repositories">,
          owner: repoData.metadata.owner,
          name: repoData.metadata.name,
          defaultBranch: repoData.metadata.defaultBranch,
          path: selectedNode.path,
        });
        setSelectedFileContent(cached?.content || "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load file";
        setSelectedFileContent(`// ${message}`);
      } finally {
        setIsLoading(false);
        setIsFileLoading(false);
      }
    };

    void loadFile();
  }, [
    selectedNode,
    repositoryId,
    repoData.metadata.owner,
    repoData.metadata.name,
    repoData.metadata.defaultBranch,
    fetchAndCache,
    setSelectedFileContent,
    setIsFileLoading,
  ]);

  const language = useMemo(() => {
    if (!selectedNode || selectedNode.type !== "file") {
      return "plaintext";
    }
    return detectLanguageFromPath(selectedNode.path);
  }, [selectedNode]);

  if (!selectedNode || selectedNode.type !== "file") {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0d14] h-full">
        <div className="text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
            <Code className="w-7 h-7 text-gray-700" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No file selected</p>
          <p className="text-xs text-gray-700">
            Click any file in the explorer to view its code
          </p>
        </div>
      </div>
    );
  }

  // filename = last segment of path
  const filename = selectedNode.path.split("/").pop() ?? selectedNode.path;
  // dirPath = everything before the filename (null when file is at root)
  const dirPath = selectedNode.path.includes("/")
    ? selectedNode.path.substring(0, selectedNode.path.lastIndexOf("/"))
    : null;

  return (
    <div className="flex-1 flex flex-col bg-[#0d0d14] h-full overflow-hidden">
      {/* File tab bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#111118]">
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {filename}
            </p>
            {dirPath && (
              <p className="text-[10px] text-gray-600 font-mono leading-tight truncate">
                /{dirPath}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />}
          <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.07] text-[10px] font-mono text-gray-400 uppercase tracking-wide">
            {language}
          </span>
          
          {/* Close Button */}
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/[0.08] rounded-md transition-colors"
            title="Close file"
            aria-label="Close file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="h-[60vh] md:h-full md:flex-1 overflow-y-auto scroll-smooth">
        <SyntaxHighlighter
          language={language}
          style={atomOneDark}
          showLineNumbers
          lineNumberStyle={{
            minWidth: "3em",
            paddingRight: "1.2em",
            color: "#3a3a4a",
            userSelect: "none",
            fontSize: "0.75rem",
          }}
          customStyle={{
            margin: 0,
            padding: "1rem 0",
            background: "transparent",
            fontSize: "0.8125rem",
            lineHeight: "1.6",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace",
          }}
          codeTagProps={{
            style: { fontFamily: "inherit" },
          }}
        >
          {selectedFileContent || "// Loading…"}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
