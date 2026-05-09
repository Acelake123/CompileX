"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, ExternalLink, ArrowRight, GitBranch, Star } from "lucide-react";
import { StoredRepoAnalysis } from "@/types/repo-analyzer";
import { Id } from "@/../convex/_generated/dataModel";
import DeleteRepoDialog from "@/components/DeleteRepoDialog";

interface PreviousAnalysesProps {
  analyses: StoredRepoAnalysis[];
  onDelete: (id: Id<"repoAnalyses">) => void;
}

export default function PreviousAnalyses({
  analyses,
  onDelete,
}: PreviousAnalysesProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<StoredRepoAnalysis | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (analysis: StoredRepoAnalysis) => {
    setSelectedAnalysis(analysis);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAnalysis) return;
    
    setIsDeleting(true);
    try {
      await onDelete(selectedAnalysis._id as Id<"repoAnalyses">);
      setShowDeleteDialog(false);
      setSelectedAnalysis(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#111118] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-inset ring-white/[0.04] overflow-hidden">
      {analyses && analyses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-3">
            <GitBranch className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-sm font-medium text-gray-400 mb-1">No analyses yet</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            Analyze your first repository to<br />see it here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.05] max-h-[520px] overflow-y-auto">
          {analyses.map((analysis: StoredRepoAnalysis, i: number) => (
            <motion.div
              key={analysis._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative px-4 py-3.5 hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer"
              onClick={() => router.push(`/repo/${analysis._id}`)}
            >
              {/* Left accent line on hover */}
              <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />

              <div className="flex items-start justify-between gap-3">
                {/* Repo info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-blue-200 transition-colors">
                    {analysis.metadata.owner}
                    <span className="text-gray-500 font-normal">/</span>
                    {analysis.metadata.name}
                  </p>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {analysis.metadata.language && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400/70" />
                        {analysis.metadata.language}
                      </span>
                    )}
                    {typeof analysis.metadata.stars === "number" && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-500/70" />
                        {analysis.metadata.stars.toLocaleString()}
                      </span>
                    )}
                    <span className="text-xs text-gray-600">
                      {new Date(analysis.analyzedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div
                  className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => router.push(`/repo/${analysis._id}`)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-500/15 text-gray-500 hover:text-blue-400 transition-colors"
                    title="Open explorer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={analysis.metadata.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
                    title="View on GitHub"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={(e): void => {
                      e.stopPropagation();
                      handleDeleteClick(analysis);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-gray-600 hover:text-red-400 transition-colors"
                    title="Delete analysis"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedAnalysis && (
        <DeleteRepoDialog
          isOpen={showDeleteDialog}
          repoName={`${selectedAnalysis.metadata.owner}/${selectedAnalysis.metadata.name}`}
          isDeleting={isDeleting}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedAnalysis(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}

