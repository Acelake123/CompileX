"use client";

import { useRepoExplorer } from "../_context/RepoContext";
import { Code2, GitBranch, TrendingUp } from "lucide-react";

export default function SummaryTab() {
  const { repoData } = useRepoExplorer();
  const { analysis } = repoData;

  return (
    <div className="space-y-6 py-6">
      {/* Summary */}
      <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Project Summary</h3>
        <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Tech Stack */}
      <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] p-6">
        <div className="flex items-center gap-2 mb-3">
          <Code2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Tech Stack</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {analysis.techStack.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1.5 bg-blue-600/20 border border-blue-600/30 rounded-full text-sm text-blue-300"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-green-600/10 backdrop-blur rounded-lg border border-green-600/20 p-6">
          <h3 className="text-lg font-semibold text-green-300 mb-3">Strengths</h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-green-400 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses */}
        <div className="bg-orange-600/10 backdrop-blur rounded-lg border border-orange-600/20 p-6">
          <h3 className="text-lg font-semibold text-orange-300 mb-3">Areas for Improvement</h3>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weakness, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-orange-400 mt-1">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Key Findings */}
      <div className="bg-purple-600/10 backdrop-blur rounded-lg border border-purple-600/20 p-6">
        <h3 className="text-lg font-semibold text-purple-300 mb-3">Key Findings</h3>
        <p className="text-gray-300 leading-relaxed">{analysis.keyFindings}</p>
      </div>

      {/* Suggested Use Cases */}
      <div className="bg-indigo-600/10 backdrop-blur rounded-lg border border-indigo-600/20 p-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-indigo-300">Suggested Use Cases</h3>
        </div>
        <ul className="space-y-2">
          {analysis.suggestedUseCases.map((useCase, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-indigo-400 mt-1">→</span>
              <span>{useCase}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline & Commit Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] p-6">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Timeline & Maturity</h3>
          </div>
          <p className="text-gray-300 text-sm">{repoData.analysis.timelineInsights}</p>
        </div>

        <div className="bg-[#12121a]/50 backdrop-blur rounded-lg border border-white/[0.05] p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Commit Activity</h3>
          <p className="text-gray-300 text-sm">{analysis.commitActivityOverview}</p>
        </div>
      </div>
    </div>
  );
}
