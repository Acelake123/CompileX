"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteRepoDialogProps {
  isOpen: boolean;
  repoName: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export default function DeleteRepoDialog({
  isOpen,
  repoName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteRepoDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onClose}
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
              <span className="text-gray-200 font-medium">{repoName}</span> including all
              chat history. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium
              bg-white/[0.05] border border-white/[0.09] text-gray-300
              hover:bg-white/[0.09] hover:border-white/[0.14] hover:text-white
              transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
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
  );
}
