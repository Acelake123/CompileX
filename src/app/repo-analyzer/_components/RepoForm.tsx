"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Loader } from "lucide-react";
import toast from "react-hot-toast";
import {
  analyzeGitHubRepository,
  fetchRepositoryTree,
  parseGitHubUrl,
} from "@/actions/repoAnalyzer";
import { generateRepositoryAnalysis } from "@/actions/aiAnalysis";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import OllamaErrorDialog from "@/components/OllamaErrorDialog";
import PrivateRepoDialog from "@/components/PrivateRepoDialog";


export default function RepoForm() {
  const [repoUrl, setRepoUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiErrorDialog, setShowAiErrorDialog] = useState(false);
  const [showPrivateRepoDialog, setShowPrivateRepoDialog] = useState(false);
  const router = useRouter();
  const saveAnalysis = useMutation(api.repoAnalyzer.saveRepoAnalysis);
  const findAnalysis = useMutation(api.repoAnalyzer.findRepoAnalysis);
  const upsertRepository = useMutation(api.repositories.upsertRepository);
  const replaceRepositoryFiles = useMutation(api.repositories.replaceRepositoryFiles);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!repoUrl.trim()) {
      toast.error("Please enter a repository URL");
      return;
    }

    // Validate URL format
    const parsed = await parseGitHubUrl(repoUrl);
    if (!parsed) {
      toast.error("Invalid GitHub repository URL format");
      return;
    }

    setIsAnalyzing(true);
    const toastId = toast.loading("Analyzing repository...");

    try {
      // Check if already analyzed
      const existing = await findAnalysis({ repoUrl: repoUrl.trim() });
      if (existing) {
        toast.success("Using cached analysis", { id: toastId });
        setRepoUrl("");
        // Redirect to explorer page
        router.push(`/repo/${existing._id}`);
        setIsAnalyzing(false);
        return;
      }

      // Fetch repository data
      toast.loading("Fetching repository data from GitHub...", { id: toastId });
      const analyzeResult = await analyzeGitHubRepository(repoUrl);

      if (!analyzeResult.success) {
        toast.dismiss(toastId);
        if (analyzeResult.error === "PRIVATE_REPO") {
          setShowPrivateRepoDialog(true);
        } else {
          setShowAiErrorDialog(true);
        }
        setIsAnalyzing(false);
        return;
      }

      const { metadata, commits, fileStructure, readme } = analyzeResult;

      toast.loading("Fetching full repository tree...", { id: toastId });
      const treeEntries = await fetchRepositoryTree(
        metadata.owner,
        metadata.name,
        metadata.defaultBranch
      );

      // Generate AI analysis
      toast.loading("Generating AI analysis...", { id: toastId });
      const analysisResult = await generateRepositoryAnalysis(
        metadata,
        commits,
        fileStructure,
        readme,
        treeEntries
      );

      if (!analysisResult.success) {
        toast.dismiss(toastId);
        setShowAiErrorDialog(true);
        setIsAnalyzing(false);
        return;
      }

      const analysis = analysisResult.analysis;

      // Save repository + files to Convex
      toast.loading("Saving repository metadata...", { id: toastId });
      const repositoryId = await upsertRepository({
        repoUrl: repoUrl.trim(),
        owner: metadata.owner,
        name: metadata.name,
        defaultBranch: metadata.defaultBranch,
        description: metadata.description,
        stars: metadata.stars,
        language: metadata.language,
      });

      toast.loading("Saving repository files...", { id: toastId });
      await replaceRepositoryFiles({
        repositoryId,
        files: treeEntries,
      });

      // Save analysis
      toast.loading("Saving analysis...", { id: toastId });
      const analysisId = await saveAnalysis({
        repoUrl: repoUrl.trim(),
        repositoryId,
        owner: parsed.owner,
        repoName: parsed.repo,
        metadata,
        commits,
        fileStructure,
        analysis,
        readme: readme || undefined,
      });

      toast.success("Repository analyzed successfully!", { id: toastId });
      setRepoUrl("");
      // Redirect to explorer page
      router.push(`/repo/${analysisId}`);
    } catch (error) {
      toast.dismiss(toastId);
      
      // Generic error fallback (Convex mutations may still throw)
      console.error("Unexpected error:", error);
      setShowAiErrorDialog(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-[#111118] border border-white/[0.08] rounded-2xl p-7 shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/[0.04]"
    >
      <div className="space-y-5">
        {/* Card heading */}
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-1">
            Analyze a Repository
          </h2>
          <p className="text-sm text-gray-500">
            Paste a public GitHub URL — analysis takes ~10 seconds.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-3">
          {/* Input */}
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="url"
              placeholder="https://github.com/owner/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isAnalyzing}
              className="w-full pl-10 pr-4 py-3.5 font-mono text-sm bg-[#0d0d14] border border-white/[0.08] rounded-xl text-white placeholder-gray-600
                focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/[0.15]
                hover:border-white/[0.14] transition-all duration-200
                disabled:opacity-40 disabled:cursor-not-allowed"
            />
          </div>

          {/* CTA Button */}
          <button
            type="submit"
            disabled={isAnalyzing}
            className="group w-full px-5 py-3.5 rounded-xl font-semibold text-sm
              bg-gradient-to-r from-blue-500 to-purple-600
              hover:from-blue-500 hover:to-purple-500
              shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
              disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
              transition-all duration-300 flex items-center justify-center gap-2.5 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Analyzing repository…</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Analyze Repository</span>
                <span className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 text-white/70">→</span>
              </>
            )}
          </button>
        </form>

        {/* Tip */}
        <div className="flex items-start gap-2.5 pt-1 border-t border-white/[0.05]">
          <span className="text-base leading-none mt-px">💡</span>
          <p className="text-xs text-gray-600 leading-relaxed">
            Supports any public repository. Fetches full recursive file tree,{" "}
            recent commits, README, and generates AI insights.
          </p>
        </div>
      </div>

      {showAiErrorDialog && (
        <OllamaErrorDialog onClose={() => setShowAiErrorDialog(false)} />
      )}

      {showPrivateRepoDialog && (
        <PrivateRepoDialog onClose={() => setShowPrivateRepoDialog(false)} />
      )}
    </motion.div>
  );
}
