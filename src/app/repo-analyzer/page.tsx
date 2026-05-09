"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import toast from "react-hot-toast";
import NavigationHeader from "@/components/NavigationHeader";
import { motion } from "framer-motion";
import { Github, GitBranch, Sparkles, Info } from "lucide-react";
import RepoForm from "./_components/RepoForm";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import PreviousAnalyses from "./_components/PreviousAnalyses";

export default function RepoAnalyzerPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const analyses = useQuery(api.repoAnalyzer.getUserRepoAnalyses);
  const deleteAnalysis = useMutation(api.repoAnalyzer.deleteRepoAnalysis);

  const handleDeleteAnalysis = async (id: Id<"repoAnalyses">) => {
    try {
      await deleteAnalysis({ repoAnalysisId: id });
      toast.success("Analysis deleted");
    } catch {
      toast.error("Failed to delete analysis");
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <NavigationHeader />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0d0d14]">
        <NavigationHeader />
        <div className="max-w-7xl mx-auto px-6 py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Github className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Repository Analyzer</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Understand any codebase
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
              instantly with AI
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Sign in to analyze GitHub repositories and chat with AI about them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-60 left-1/4 w-[400px] h-[300px] bg-purple-600/5 rounded-full blur-[100px]" />
      </div>

      <NavigationHeader />

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3.5 py-1 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-300 tracking-wide uppercase">
              AI-Powered Analysis
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-2">
            Repository{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 text-transparent bg-clip-text">
              Analyzer
            </span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl">
            Paste any public GitHub URL to get AI-generated insights, explore the file tree,
            and chat with the codebase.
          </p>
        </motion.div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* LEFT — Analyze (dominant) */}
          <div className="lg:col-span-3 space-y-4">
            <RepoForm />

            {/* Helper Note */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-start gap-3 bg-blue-500/[0.07] border border-blue-500/[0.15] rounded-xl px-4 py-3.5"
            >
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-300">You&apos;ll be redirected after analysis</p>
                <p className="text-xs text-blue-400/60 mt-0.5 leading-relaxed">
                  Opens the explorer — file tree, AI chat, commit history, and full code viewer.
                </p>
              </div>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-wrap gap-2 pt-1"
            >
              {["Recursive file tree", "AI code chat", "Commit history", "Syntax highlighting"].map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.07] text-xs text-gray-400"
                >
                  <GitBranch className="w-3 h-3 text-blue-400/70" />
                  {f}
                </span>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — Previous Analyses */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">
                  Previous Analyses
                </h2>
                {analyses && analyses.length > 0 && (
                  <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full px-2.5 py-0.5 font-medium">
                    {analyses.length}
                  </span>
                )}
              </div>
              <PreviousAnalyses
                analyses={analyses || []}
                onDelete={handleDeleteAnalysis}
              />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
