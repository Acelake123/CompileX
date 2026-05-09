"use client";

import { useRepoExplorer } from "../_context/RepoContext";
import { ChevronRight, ChevronDown, File, Folder, X, FileText, Code } from "lucide-react";
import { useState } from "react";

export default function DirectoryTab() {
  const { repoData, selectedFile, setSelectedFile } = useRepoExplorer();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { fileStructure, metadata } = repoData;

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (filename: string) => {
    setSelectedFile(selectedFile === filename ? null : filename);
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-6">
      {/* File Tree - Left */}
      <div className="lg:col-span-1">
        <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] overflow-hidden sticky top-24">
          <div className="p-4 border-b border-white/[0.05]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Repository
            </h3>
            <p className="text-xs text-gray-600 mt-1 truncate">{metadata.name}</p>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {fileStructure.Files.length === 0 && fileStructure.Directories.length === 0 ? (
              <div className="p-4 text-xs text-gray-600 text-center">No files found</div>
            ) : (
              <>
                {/* Directories */}
                {fileStructure.Directories.map((dir) => (
                  <button
                    key={dir}
                    onClick={() => toggleFolder(dir)}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-white/[0.05]
                      text-gray-300 hover:text-white transition-all text-sm group text-left"
                  >
                    {expandedFolders.has(dir) ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                    <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <span className="truncate">{dir}</span>
                  </button>
                ))}

                {/* Files */}
                {fileStructure.Files.map((file) => (
                  <button
                    key={file}
                    onClick={() => handleFileClick(file)}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-all text-left ${
                      selectedFile === file
                        ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-500"
                        : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{file}</span>
                  </button>
                ))}
              </>
            )}
          </div>

          {selectedFile && (
            <div className="p-3 border-t border-white/[0.05] bg-blue-600/10">
              <button
                onClick={() => setSelectedFile(null)}
                className="w-full text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Viewer - Right */}
      <div className="lg:col-span-3">
        {selectedFile ? (
          <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] overflow-hidden flex flex-col h-96">
            {/* File Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#0d0d12]/30">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{selectedFile}</h3>
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
              <div className="bg-gray-900/50 rounded-lg border border-gray-800/50 p-4 font-mono text-sm space-y-4">
                <div className="text-gray-600">
                  <p className="text-xs text-gray-500 mb-2">
                    📌 To view full file contents, visit the GitHub repository:
                  </p>
                  <a
                    href={`${metadata.url}/blob/main/${selectedFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs break-words transition-colors"
                  >
                    {metadata.url}/blob/main/{selectedFile}
                  </a>
                </div>

                <div className="border-t border-gray-800 pt-4">
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
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05]">
            <div className="text-center">
              <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">No file selected</h3>
              <p className="text-sm text-gray-500">
                Select a file from the tree to view its details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
