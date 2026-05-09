"use client";

import { ChevronRight, ChevronDown, File, Folder, FolderOpen, GitBranch } from "lucide-react";
import { useMemo, useState } from "react";
import { RepositoryFileEntry } from "@/types/repo-analyzer";
import { useRepoExplorer } from "../_context/RepoContext";

interface TreeNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: TreeNode[];
}

function buildTree(entries: RepositoryFileEntry[]): TreeNode[] {
  const root: Record<string, TreeNode> = {};

  const ensureDir = (path: string): TreeNode => {
    if (!root[path]) {
      root[path] = { name: path, path, type: "dir", children: [] };
    }
    return root[path];
  };

  const byPath = new Map<string, TreeNode>();

  entries.forEach((entry) => {
    const parts = entry.path.split("/");
    let currentPath = "";
    let parent: TreeNode | null = null;

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;
      const nodeType: "file" | "dir" = isLast ? entry.type : "dir";

      if (!byPath.has(currentPath)) {
        const node: TreeNode = {
          name: part,
          path: currentPath,
          type: nodeType,
          children: nodeType === "dir" ? [] : undefined,
        };
        byPath.set(currentPath, node);

        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          const rootNode = ensureDir(currentPath);
          rootNode.name = part;
          rootNode.path = currentPath;
          rootNode.type = nodeType;
          rootNode.children = node.children;
        }
      }

      const existing = byPath.get(currentPath) || root[currentPath];
      if (existing) {
        if (existing.type !== nodeType) {
          existing.type = nodeType;
        }
        parent = existing;
      }
    });
  });

  const topLevel = Object.values(root);
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "dir" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((node) => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(topLevel);
  return topLevel;
}

function fileIconColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "text-blue-400", tsx: "text-blue-400",
    js: "text-yellow-400", jsx: "text-yellow-400",
    py: "text-green-400",
    json: "text-yellow-300",
    md: "text-gray-300",
    css: "text-pink-400", scss: "text-pink-400",
    html: "text-orange-400",
    rs: "text-orange-300",
    go: "text-cyan-400",
    java: "text-red-400",
    rb: "text-red-300",
  };
  return map[ext] || "text-gray-500";
}

export default function RepoFileTree() {
  const { repoData, repositoryFiles, selectedNode, setSelectedNode } = useRepoExplorer();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(repositoryFiles), [repositoryFiles]);

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const isExpanded = expanded.has(node.path);
    const isSelected = selectedNode?.path === node.path && selectedNode?.type === node.type;

    return (
      <div key={node.path}>
        {node.type === "dir" ? (
          <div
            className={`relative w-full flex items-center gap-1.5 py-1 text-sm text-left group transition-colors duration-100
              ${isSelected
                ? "bg-blue-600/[0.12] text-blue-200"
                : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
              }`}
            style={{ paddingLeft: `${10 + depth * 14}px`, paddingRight: "8px" }}
          >
            {isSelected && (
              <span className="absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-r bg-blue-400" />
            )}
            <button
              onClick={() => toggleExpand(node.path)}
              className="flex-shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => setSelectedNode({ path: node.path, type: "dir" })}
              className="flex items-center gap-1.5 flex-1 text-left min-w-0"
            >
              {isExpanded ? (
                <FolderOpen className="w-3.5 h-3.5 text-yellow-400/80 flex-shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-yellow-500/70 flex-shrink-0" />
              )}
              <span className="truncate text-xs font-medium">{node.name}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSelectedNode({ path: node.path, type: "file" })}
            className={`relative w-full flex items-center gap-1.5 py-1 text-sm text-left transition-colors duration-100
              ${isSelected
                ? "bg-blue-600/[0.12] text-blue-200"
                : "text-gray-400 hover:bg-white/[0.04] hover:text-gray-200"
              }`}
            style={{ paddingLeft: `${26 + depth * 14}px`, paddingRight: "8px" }}
          >
            {isSelected && (
              <span className="absolute left-0 top-0.5 bottom-0.5 w-0.5 rounded-r bg-blue-400" />
            )}
            <File className={`w-3.5 h-3.5 flex-shrink-0 ${fileIconColor(node.name)}`} />
            <span className="truncate text-xs">{node.name}</span>
          </button>
        )}

        {node.type === "dir" && isExpanded && node.children && (
          <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0c12] overflow-hidden">
      {/* Panel header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-0.5">
          <GitBranch className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
            Explorer
          </span>
        </div>
        <p className="text-xs font-medium text-gray-300 truncate pl-5">
          {repoData.metadata.name}
        </p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {tree.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <Folder className="w-8 h-8 text-gray-700" />
            <p className="text-xs text-gray-600">No files indexed</p>
            <p className="text-[10px] text-gray-700">Re-analyze to populate the file tree</p>
          </div>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
