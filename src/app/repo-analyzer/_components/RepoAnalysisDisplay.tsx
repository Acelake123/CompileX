"use client";

import { motion } from "framer-motion";
import { Star, Code2, TrendingUp, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { StoredRepoAnalysis } from "@/types/repo-analyzer";
import MarkdownContent from "@/components/MarkdownContent";

interface RepoAnalysisDisplayProps {
  analysis: StoredRepoAnalysis;
  onDelete: () => void;
}

export default function RepoAnalysisDisplay({
  analysis,
  onDelete,
}: RepoAnalysisDisplayProps) {
  const { metadata, analysis: aiAnalysis, commits, fileStructure } = analysis;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Code2 className="w-6 h-6 text-blue-400" />
              {metadata.name}
            </h2>
            <p className="text-gray-400">
              by <span className="text-blue-300">{metadata.owner}</span>
            </p>
          </div>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
            title="Delete analysis"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {metadata.description && (
          <p className="text-gray-300 mb-4">{metadata.description}</p>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Stars</p>
            <p className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
              <Star className="w-4 h-4" />
              {metadata.stars.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Language</p>
            <p className="text-xl font-semibold text-purple-400">{metadata.language}</p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Commits</p>
            <p className="text-xl font-semibold text-blue-400">
              {commits.totalCommits.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Commits/Week</p>
            <p className="text-xl font-semibold text-green-400">
              {commits.averageCommitsPerWeek.toFixed(1)}
            </p>
          </div>
        </div>

        <a
          href={metadata.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-300 hover:bg-blue-500/30 transition-colors text-sm font-medium"
        >
          View on GitHub →
        </a>
      </motion.div>

      {/* Summary */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Project Summary</h3>
        <MarkdownContent content={aiAnalysis.summary} />
      </motion.div>

      {/* Tech Stack */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Tech Stack</h3>
        <div className="flex flex-wrap gap-2">
          {aiAnalysis.techStack.map((tech, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          variants={itemVariants}
          className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {aiAnalysis.strengths.map((strength, idx) => (
              <li key={idx} className="text-gray-300 flex gap-2">
                <span className="text-green-400 font-bold">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {aiAnalysis.weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-gray-300 flex gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Key Findings */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Key Findings</h3>
        <MarkdownContent content={aiAnalysis.keyFindings} />
      </motion.div>

      {/* Commit Activity */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Commit Activity Overview
        </h3>
        <MarkdownContent content={aiAnalysis.commitActivityOverview} />
      </motion.div>

      {/* Timeline Insights */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Timeline Insights</h3>
        <MarkdownContent content={aiAnalysis.timelineInsights} />
      </motion.div>

      {/* Suggested Use Cases */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Suggested Use Cases</h3>
        <ul className="space-y-2">
          {aiAnalysis.suggestedUseCases.map((useCase, idx) => (
            <li key={idx} className="text-gray-300 flex gap-2">
              <span className="text-purple-400 font-bold">→</span>
              <span>{useCase}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* File Structure */}
      <motion.div
        variants={itemVariants}
        className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">File Structure (Top Level)</h3>
        <div className="grid grid-cols-2 gap-4">
          {fileStructure.Directories.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Directories:</p>
              <div className="space-y-1">
                {fileStructure.Directories.slice(0, 8).map((dir, idx) => (
                  <p key={idx} className="text-sm text-blue-300">
                    📁 {dir}
                  </p>
                ))}
                {fileStructure.Directories.length > 8 && (
                  <p className="text-sm text-gray-500">
                    +{fileStructure.Directories.length - 8} more
                  </p>
                )}
              </div>
            </div>
          )}
          {fileStructure.Files.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Files:</p>
              <div className="space-y-1">
                {fileStructure.Files.slice(0, 8).map((file, idx) => (
                  <p key={idx} className="text-sm text-yellow-300">
                    📄 {file}
                  </p>
                ))}
                {fileStructure.Files.length > 8 && (
                  <p className="text-sm text-gray-500">
                    +{fileStructure.Files.length - 8} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
