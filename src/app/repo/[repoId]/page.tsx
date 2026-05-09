"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import {
  ArrowLeft, Trash2, Star, Github, GitCommit,
  ExternalLink, MessageSquare, X, BookOpen,
  Layers, FolderTree, Lightbulb, ChevronRight, AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import NavigationHeader from "@/components/NavigationHeader";
import { RepoExplorerProvider } from "./_context/RepoContext";
import RepoFileTree from "./_components/RepoFileTree";
import CodeViewer from "./_components/CodeViewer";
import RepoChatPanel from "./_components/RepoChatPanel";

function formatCommitDate(dateString: string): string {
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

function RepoExplorerContent() {
  const params = useParams();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activePanel, setActivePanel] = useState<"summary" | "chat" | null>(null);
  const [showFileTree, setShowFileTree] = useState(false);

  const repoAnalysisId = params.repoId as string;
  const repoData = useQuery(api.repoAnalyzer.getRepoAnalysis, {
    repoAnalysisId: repoAnalysisId as Id<"repoAnalyses">,
  });

  const deleteAnalysis = useMutation(api.repoAnalyzer.deleteRepoAnalysis);

  const handleDelete = () => setShowDeleteConfirm(true);

  const executeDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await deleteAnalysis({ repoAnalysisId: repoAnalysisId as Id<"repoAnalyses"> });
      toast.success("Analysis deleted successfully");
      router.push("/repo-analyzer");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to delete analysis";
      toast.error(errorMsg);
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!repoData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-72 bg-white/[0.06] rounded-lg animate-pulse" />
          <div className="h-4 w-52 bg-white/[0.04] rounded animate-pulse" />
        </div>
        <div className="flex h-[62vh] rounded-xl overflow-hidden border border-white/[0.06]">
          <div className="w-64 border-r border-white/[0.06] p-3 space-y-2 flex-shrink-0">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-5 bg-white/[0.04] rounded animate-pulse"
                style={{ width: `${50 + (i % 5) * 10}%` }}
              />
            ))}
          </div>
          <div className="flex-1 p-6">
            <div className="h-full rounded-lg bg-white/[0.03] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

        {/* ── REPO HEADER ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">

          {/* Left: back + identity */}
          <div className="flex items-start gap-3 min-w-0">
            <button
              onClick={() => router.push("/repo-analyzer")}
              className="mt-1.5 p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
              title="Back to analyzer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex-1">
              {/* Repo name + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate max-w-full">
                  <span className="text-gray-500 font-normal">
                    {repoData.metadata.owner}&nbsp;/&nbsp;
                  </span>
                  {repoData.metadata.name}
                </h1>
                {repoData.metadata.stars != null && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                    <Star className="w-3 h-3 fill-yellow-400" />
                    {repoData.metadata.stars.toLocaleString()}
                  </span>
                )}
                {repoData.metadata.language && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    {repoData.metadata.language}
                  </span>
                )}
              </div>

{/* GitHub link + description */}
<div className="flex items-center gap-3 mt-1.5 flex-wrap min-w-0">
  <a
    href={repoData.metadata.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-400 transition-colors group min-w-0"
  >
    <Github className="w-3.5 h-3.5 flex-shrink-0" />

    <span
      title={`${repoData.metadata.owner}/${repoData.metadata.name}`}
      className="font-mono text-xs truncate max-w-[180px] sm:max-w-[300px] md:max-w-[420px]"
    >
      {repoData.metadata.owner}/{repoData.metadata.name}
    </span>

    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
  </a>

  {repoData.metadata.description && (
    <span className="text-xs text-gray-500 truncate max-w-[200px] sm:max-w-md hidden sm:block">
      {repoData.metadata.description}
    </span>
  )}
</div>

              {/* Re-analyze warning */}
              {!repoData.repositoryId && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-orange-400 bg-orange-400/[0.08] border border-orange-400/20">
                  ⚠ File index unavailable — re-analyze to enable code-aware chat
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary + Chat + Delete */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:flex-shrink-0 sm:mt-0.5">
            {/* Summary button */}
            <button
              onClick={() => setActivePanel((v) => v === "summary" ? null : "summary")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                border transition-all duration-200
                ${activePanel === "summary"
                  ? "bg-white/[0.10] border-white/[0.20] text-white ring-1 ring-white/[0.12]"
                  : "bg-white/[0.05] border-white/[0.09] text-gray-300 hover:bg-white/[0.09] hover:border-white/[0.14] hover:text-white"
                }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Summary</span>
            </button>

            {/* AI Chat button */}
            <button
              onClick={() => setActivePanel((v) => v === "chat" ? null : "chat")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                border transition-all duration-200
                ${activePanel === "chat"
                  ? "bg-white/[0.10] border-white/[0.20] text-white ring-1 ring-white/[0.12]"
                  : "bg-white/[0.05] border-white/[0.09] text-gray-300 hover:bg-white/[0.09] hover:border-white/[0.14] hover:text-white"
                }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Chat</span>
            </button>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                bg-red-500/[0.08] border border-red-500/20 text-red-400
                hover:bg-red-500/[0.15] hover:border-red-500/30 hover:text-red-300
                disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDeleting ? "Deleting…" : "Delete"}</span>
            </button>
          </div>
        </div>

        {/* ── FILE EXPLORER + CODE VIEWER ──────────────────────────── */}
        <div className="flex flex-col sm:flex-row h-auto sm:h-[62vh] rounded-xl overflow-hidden border border-white/[0.07] shadow-2xl shadow-black/40">

          {/* Mobile: toggle button for file tree */}
          <div className="sm:hidden flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-[#111118]">
            <span className="text-xs text-gray-400 font-medium">File Explorer</span>
            <button
              onClick={() => setShowFileTree((v) => !v)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08] transition-colors"
            >
              {showFileTree ? "Hide" : "Show"} Files
            </button>
          </div>

          {/* Left: File tree — always visible on sm+, toggleable on mobile */}
          <div className={`
            sm:w-64 sm:flex-shrink-0 border-b sm:border-b-0 sm:border-r border-white/[0.06] flex flex-col overflow-hidden
            ${showFileTree ? "h-48 sm:h-auto" : "h-0 sm:h-auto overflow-hidden"}
            transition-all duration-300
          `}>
            <RepoFileTree />
          </div>

          {/* Right: Code viewer */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden min-h-[300px] sm:min-h-0">
            <CodeViewer />
          </div>
        </div>

        {/* ── COMMIT HISTORY ────────────────────────────────────────── */}
        {repoData.commits?.recentCommits && repoData.commits.recentCommits.length > 0 && (
          <div className="rounded-xl border border-white/[0.07] overflow-hidden shadow-xl shadow-black/30">
            {/* Section header */}
            <div className="px-4 sm:px-5 py-3 border-b border-white/[0.06] bg-[#111118] flex items-center gap-2.5 flex-wrap">
              <GitCommit className="w-4 h-4 text-purple-400 shrink-0" />
              <h2 className="text-sm font-semibold text-white">Commit History</h2>
              <span className="text-xs text-gray-500">
                · {repoData.commits.totalCommits.toLocaleString()} total
              </span>
              <span className="ml-auto text-xs text-gray-600 hidden sm:block">
                {repoData.commits.averageCommitsPerWeek.toFixed(1)} commits / week avg
              </span>
            </div>

            {/* Commit rows */}
            <div className="bg-[#0d0d12]/70 divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
              {repoData.commits.recentCommits.map((commit, idx) => {
                const fullDate = new Date(commit.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 px-4 sm:px-5 py-3 hover:bg-white/[0.025] transition-colors"
                  >
                    {/* Commit message */}
                    <p className="text-sm text-gray-300 flex-1 min-w-0 truncate leading-snug">
                      {commit.message}
                    </p>

                    {/* Author + date + hash */}
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 font-medium truncate max-w-[160px]">
                        {commit.author}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400" title={fullDate}>
                          {formatCommitDate(commit.date)}
                        </span>
                        <span className="text-gray-700 text-xs hidden sm:block">·</span>
                        <span className="text-xs text-gray-500 hidden sm:block">{fullDate}</span>
                        <code className="font-mono text-[10px] text-gray-500 bg-white/[0.06] border border-white/[0.07] px-1.5 py-0.5 rounded">
                          {commit.hash.substring(0, 7)}
                        </code>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING SUMMARY PANEL ───────────────────────────────── */}
      {activePanel === "summary" && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 flex flex-col
          w-full sm:w-[520px] h-[80vh] sm:h-[75vh] sm:max-h-[720px] sm:min-h-[400px]
          rounded-t-2xl sm:rounded-2xl overflow-hidden border-t sm:border border-white/[0.10]
          bg-[#0d0d12] shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/[0.04]">

          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#111118]">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-white">Repository Summary</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
              aria-label="Close summary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/[0.08]">
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                <Lightbulb className="w-3 h-3" />
                Overview
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{repoData.analysis.summary}</p>
            </section>

            {repoData.analysis.techStack && repoData.analysis.techStack.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Layers className="w-3 h-3" />
                  Tech Stack
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {repoData.analysis.techStack.map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {repoData.fileStructure && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <FolderTree className="w-3 h-3" />
                  Project Structure
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.07]">
                    {repoData.fileStructure.Files.length} files
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/[0.07]">
                    {repoData.fileStructure.Directories.length} directories
                  </span>
                </div>
                {repoData.fileStructure.Directories.length > 0 && (
                  <div className="space-y-0.5">
                    {repoData.fileStructure.Directories.slice(0, 10).map((dir, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400 py-0.5">
                        <ChevronRight className="w-3 h-3 text-gray-600 flex-shrink-0" />
                        <span className="font-mono">{dir}</span>
                      </div>
                    ))}
                    {repoData.fileStructure.Directories.length > 10 && (
                      <p className="text-xs text-gray-600 pl-4.5 pt-0.5">
                        +{repoData.fileStructure.Directories.length - 10} more directories
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}

            {repoData.analysis.keyFindings && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Lightbulb className="w-3 h-3" />
                  Key Insights
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{repoData.analysis.keyFindings}</p>
              </section>
            )}

            {repoData.analysis.strengths && repoData.analysis.strengths.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Star className="w-3 h-3" />
                  Strengths
                </div>
                <ul className="space-y-1">
                  {repoData.analysis.strengths.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {/* ── FLOATING CHAT PANEL ──────────────────────────────────── */}
      {activePanel === "chat" && (
        <div className="fixed bottom-0 right-0 sm:bottom-5 sm:right-5 z-50 flex flex-col
          w-full sm:w-[520px] h-[80vh] sm:h-[75vh] sm:max-h-[720px] sm:min-h-[400px]
          rounded-t-2xl sm:rounded-2xl overflow-hidden border-t sm:border border-white/[0.10]
          bg-[#0d0d12] shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/[0.04]">

          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#111118]">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-sm font-semibold text-white">AI Chat</span>
            </div>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/[0.06] transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <RepoChatPanel repoAnalysisId={repoAnalysisId as Id<"repoAnalyses">} />
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ─────────────────────────────────── */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-sm rounded-2xl border border-white/[0.10]
              bg-[#111118] shadow-2xl shadow-black/70 p-5 sm:p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-red-500/[0.12] border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white">Delete Repository</h2>
                <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                  This will permanently delete the analysis for{" "}
                  <span className="text-gray-200 font-medium">
                    {repoData.metadata.owner}/{repoData.metadata.name}
                  </span>{" "}
                  including all chat history. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium
                  bg-white/[0.05] border border-white/[0.09] text-gray-300
                  hover:bg-white/[0.09] hover:border-white/[0.14] hover:text-white
                  transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                  bg-red-500/[0.15] border border-red-500/30 text-red-300
                  hover:bg-red-500/[0.25] hover:border-red-500/50 hover:text-red-200
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Deleting…" : "Delete Repository"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Page Component
export default function RepoExplorerPage() {
  const params = useParams();
  const repoAnalysisId = params.repoId as string;

  const repoData = useQuery(api.repoAnalyzer.getRepoAnalysis, {
    repoAnalysisId: repoAnalysisId as Id<"repoAnalyses">,
  });
  const repositoryFiles = useQuery(
    api.repositories.listRepositoryFiles,
    repoData?.repositoryId
      ? { repositoryId: repoData.repositoryId as Id<"repositories"> }
      : "skip"
  );

  if (!repoData) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div className="space-y-3">
            <div className="h-8 w-72 bg-white/[0.06] rounded-lg animate-pulse" />
            <div className="h-4 w-52 bg-white/[0.04] rounded animate-pulse" />
          </div>
          <div className="flex h-[62vh] rounded-xl overflow-hidden border border-white/[0.06]">
            <div className="w-64 border-r border-white/[0.06] p-3 space-y-2 flex-shrink-0">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-5 bg-white/[0.04] rounded animate-pulse"
                  style={{ width: `${50 + (i % 5) * 10}%` }}
                />
              ))}
            </div>
            <div className="flex-1 p-6">
              <div className="h-full rounded-lg bg-white/[0.03] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <NavigationHeader />
      <RepoExplorerProvider repoData={repoData} repositoryFiles={repositoryFiles || []}>
        <RepoExplorerContent />
      </RepoExplorerProvider>
    </div>
  );
}