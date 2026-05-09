"use client";

import { X, LogIn } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface AuthRequiredDialogProps {
  onClose: () => void;
  message?: string;
}

export default function AuthRequiredDialog({
  onClose,
  message = "Please sign in to continue.",
}: AuthRequiredDialogProps) {

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // 🔒 Prevent background scroll
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  // 🧠 Render using Portal (fixes positioning issues globally)
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#1e1e2e]
        border border-white/[0.08] p-6 shadow-2xl shadow-black/60
        ring-1 ring-inset ring-white/[0.04]
        animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-base font-semibold text-white">
              Authentication Required
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-400 mb-6 break-words">
          {message}
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <SignInButton mode="modal">
            <button
              className="w-full py-2.5 rounded-lg font-semibold text-sm
              bg-gradient-to-r from-blue-500 to-blue-600
              hover:from-blue-600 hover:to-blue-700
              shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30
              text-white transition-all duration-200"
            >
              Sign In
            </button>
          </SignInButton>

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}