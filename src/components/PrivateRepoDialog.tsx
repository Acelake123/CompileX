"use client";

import { X, Lock } from "lucide-react";

interface PrivateRepoDialogProps {
  onClose: () => void;
}

export default function PrivateRepoDialog({ onClose }: PrivateRepoDialogProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1e1e2e] border border-white/[0.08] rounded-xl p-6 w-full max-w-sm shadow-2xl shadow-black/60 ring-1 ring-inset ring-white/[0.04]">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="text-base font-semibold text-white leading-tight">
              Private Repository Detected
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors ml-2 mt-0.5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          This repository is private or inaccessible.
          <br />
          Please provide a public GitHub repository to analyze.
        </p>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-sm font-medium text-gray-200 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
