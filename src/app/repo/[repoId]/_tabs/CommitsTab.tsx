"use client";

import { useRepoExplorer } from "../_context/RepoContext";
import { GitCommit } from "lucide-react";

function formatDateRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export default function CommitsTab() {
  const { repoData } = useRepoExplorer();
  const { commits } = repoData;

  return (
    <div className="py-6 space-y-4">
      {/* Stats Header */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Commits</p>
          <p className="text-3xl font-bold text-white">{commits.totalCommits}</p>
        </div>
        <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg. Per Week</p>
          <p className="text-3xl font-bold text-white">
            {commits.averageCommitsPerWeek.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Commits List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <GitCommit className="w-5 h-5" />
          Recent Commits
        </h3>

        <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] divide-y divide-white/[0.05] overflow-hidden">
          {commits.recentCommits.map((commit, idx) => (
            <div key={idx} className="p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium break-words">
                    {commit.message}
                  </p>
                </div>
                <code className="text-xs font-mono text-gray-500 flex-shrink-0 bg-gray-800/30 px-2 py-1 rounded">
                  {commit.hash.substring(0, 7)}
                </code>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>by <span className="text-gray-400">{commit.author}</span></span>
                <span>{formatDateRelative(commit.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
