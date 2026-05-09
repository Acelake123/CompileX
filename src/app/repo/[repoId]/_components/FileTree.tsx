"use client";

import { ChevronRight, ChevronDown, File, Folder } from "lucide-react";
import { useState, useMemo } from "react";
import { useRepoExplorer } from "../_context/RepoExplorerContext";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
}

export default function FileTree() {
  const { repoData, selectedFile, setSelectedFile } = useRepoExplorer();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const fileTree = useMemo(() => {
    if (!repoData) return [];

    const tree: FileNode[] = [];

    // Add files from root
    repoData.fileStructure.Files.forEach((file) => {
      tree.push({
        name: file,
        path: file,
        type: "file",
      });
    });

    // Add directories
    repoData.fileStructure.Directories.forEach((dir) => {
      tree.push({
        name: dir,
        path: dir,
        type: "folder",
      });
    });

    return tree.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [repoData]);

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

  const renderNode = (node: FileNode, depth: number) => {
    const isExpanded = expandedFolders.has(node.path);

    return (
      <div key={node.path}>
        {node.type === "folder" ? (
          <>
            <button
              onClick={() => toggleFolder(node.path)}
              className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-white/[0.05]
                text-gray-300 hover:text-white transition-all text-sm group"
              style={{ paddingLeft: `${12 + depth * 12}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              <Folder className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <span className="truncate">{node.name}</span>
            </button>
            {isExpanded && (
              <div>
                {/* Render common files in popular directories */}
                {["src", "lib", "components", "pages", "app"].includes(
                  node.name
                ) && (
                  <div className="text-xs text-gray-600 px-4 py-2"
                    style={{ paddingLeft: `${12 + (depth + 1) * 12}px` }}
                  >
                    (Popular directory - explore on GitHub for full contents)
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <button
            onClick={() =>
              setSelectedFile(
                selectedFile === node.path ? null : node.path
              )
            }
            className={`w-full flex items-center gap-2 px-4 py-1.5 text-sm
              transition-all text-left truncate group ${
                selectedFile === node.path
                  ? "bg-blue-600/20 text-blue-300 border-l-2 border-blue-500"
                  : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
              }`}
            style={{ paddingLeft: `${12 + depth * 12}px` }}
          >
            <File className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <span className="truncate">{node.name}</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-[#0d0d12]/50 backdrop-blur border-r border-white/[0.05] 
      flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.05]">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Repository
        </h2>
        <p className="text-xs text-gray-600 mt-1 truncate">
          {repoData?.metadata.name}
        </p>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        {fileTree.length === 0 ? (
          <div className="p-4 text-xs text-gray-600 text-center">
            No files found
          </div>
        ) : (
          fileTree.map((node) => renderNode(node, 0))
        )}
      </div>

      {/* Footer */}
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
  );
}
