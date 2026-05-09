"use client";

import { X, Code, FileText } from "lucide-react";
import { useRepoExplorer } from "../_context/RepoExplorerContext";

export default function FileViewer() {
  const { repoData, selectedFile, setSelectedFile } = useRepoExplorer();

  if (!selectedFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#12121a]/30">
        <div className="text-center">
          <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            No file selected
          </h3>
          <p className="text-sm text-gray-500">
            Select a file from the tree to view its contents
          </p>
        </div>
      </div>
    );
  }

  // Check file extension for language detection
  const getLanguageFromExt = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const langMap: { [key: string]: string } = {
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
    };
    return langMap[ext] || "plaintext";
  };

  return (
    <div className="flex-1 flex flex-col bg-[#12121a] border-r border-white/[0.05]">
      {/* File Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#0d0d12]/30">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="text-sm font-semibold text-white">{selectedFile}</h3>
            <p className="text-xs text-gray-500">
              Language: {getLanguageFromExt(selectedFile)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedFile(null)}
          className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* File Content Preview */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-gray-900/50 rounded-lg border border-gray-800/50 p-4 font-mono text-sm">
          <div className="text-gray-600 mb-4">
            <p className="text-xs text-gray-500 mb-2">
              📌 To view full file contents, visit the GitHub repository:
            </p>
            <a
              href={`${repoData?.metadata.url}/blob/main/${selectedFile}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs break-words transition-colors"
            >
              {repoData?.metadata.url}/blob/main/{selectedFile}
            </a>
          </div>

          <div className="border-t border-gray-800 pt-4 mt-4">
            <p className="text-gray-400 text-xs">
              💡 Ask the AI chat above to analyze this file&apos;s:
            </p>
            <ul className="text-gray-500 text-xs mt-2 space-y-1">
              <li>• Purpose and functionality</li>
              <li>• Code structure and patterns</li>
              <li>• Integration with other modules</li>
              <li>• Potential improvements</li>
            </ul>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
            <p className="text-xs text-blue-400 font-semibold mb-1">
              Repository Context
            </p>
            <p className="text-xs text-gray-400">
              Using full repo analysis + this specific file for better AI responses
            </p>
          </div>
          <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
            <p className="text-xs text-green-400 font-semibold mb-1">
              AI Chat Scope
            </p>
            <p className="text-xs text-gray-400">
              Questions will focus on {selectedFile}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
