"use client";

import { GitCommit } from "lucide-react";
import { useRepoExplorer } from "../_context/RepoExplorerContext";

// Simple date formatter
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

export default function CommitsList() {
  const { repoData } = useRepoExplorer();

  if (!repoData?.commits?.recentCommits?.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No commits available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#12121a]/50 backdrop-blur border-t border-white/[0.05]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2 mb-2">
          <GitCommit className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Recent Commits</h2>
        </div>
        <p className="text-xs text-gray-500">
          Total: {repoData.commits.totalCommits} commits
        </p>
      </div>

      {/* Commits List */}
      <div className="divide-y divide-white/[0.05] max-h-96 overflow-y-auto">
        {repoData.commits.recentCommits.map((commit, idx) => (
          <div
            key={idx}
            className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
          >
            {/* Commit Message */}
            <p className="text-sm text-gray-200 font-medium mb-2 line-clamp-2">
              {commit.message}
            </p>

            {/* Commit Meta */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="text-gray-600">
                  by <span className="text-gray-400">{commit.author}</span>
                </span>
                <span className="text-gray-600">
                  {formatDateRelative(commit.date)}
                </span>
              </div>

              {/* Commit Hash */}
              <code className="text-gray-600 font-mono bg-gray-800/30 px-2 py-1 rounded">
                {commit.hash.substring(0, 7)}
              </code>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Footer */}
      <div className="px-6 py-4 border-t border-white/[0.05] bg-gradient-to-r from-purple-600/5 to-blue-600/5">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-500 mb-1">Avg. Commits/Week</p>
            <p className="text-lg font-semibold text-white">
              {repoData.commits.averageCommitsPerWeek.toFixed(1)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Total Commits</p>
            <p className="text-lg font-semibold text-white">
              {repoData.commits.totalCommits}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
