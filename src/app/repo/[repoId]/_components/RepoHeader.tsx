"use client";

import { ArrowLeft, ExternalLink, Star, Code2 } from "lucide-react";
import Link from "next/link";
import { useRepoExplorer } from "../_context/RepoExplorerContext";

export default function RepoHeader() {
  const { repoData, selectedFile } = useRepoExplorer();

  if (!repoData) return null;

  return (
    <div className="bg-[#0d0d12]/50 backdrop-blur border-b border-white/[0.05]">
      {/* Top Navigation Bar */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/repo-analyzer"
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-semibold text-white">
                {repoData.metadata.owner}/{repoData.metadata.name}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {repoData.metadata.description}
            </p>
          </div>
        </div>

        {/* Stats & Links */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-300">
              {repoData.metadata.stars}
            </span>
          </div>

          <a
            href={repoData.metadata.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors text-gray-400 hover:text-gray-200"
            title="View on GitHub"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Current Selection Indicator */}
      {selectedFile && (
        <div className="px-6 py-2 bg-blue-600/10 border-t border-blue-600/20">
          <p className="text-xs text-blue-300">
            📄 Currently viewing: <span className="font-mono">{selectedFile}</span>
          </p>
        </div>
      )}
    </div>
  );
}
