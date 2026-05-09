"use client";

import { Snippet } from "@/types";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState, useEffect } from "react";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, Trash2, User, AlertTriangle } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import StarButton from "@/components/StarButton";
import { createPortal } from "react-dom";

function SnippetCard({ snippet }: { snippet: Snippet }) {
  const { user } = useUser();
  const deleteSnippet = useMutation(api.snippets.deleteSnippet);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSnippet({ snippetId: snippet._id });
      toast.success("Snippet deleted successfully");
    } catch (error) {
      console.log("Error deleting snippet:", error);
      toast.error("Error deleting snippet");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <motion.div
        layout
        className="group relative"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        <Link href={`/snippets/${snippet._id}`} className="h-full block">
          <div className="relative h-full bg-[#1e1e2e]/80 backdrop-blur-sm rounded-xl border border-[#313244]/50 hover:border-[#313244] transition-all duration-300 overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-20 group-hover:opacity-30 transition-all duration-500" />
                    <div className="relative p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all duration-500">
                      <Image
                        src={`/${snippet.language}.png`}
                        alt={`${snippet.language} logo`}
                        className="w-6 h-6 object-contain"
                        width={24}
                        height={24}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium">
                      {snippet.language}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="size-3" />
                      {new Date(snippet._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div
                  className="absolute top-5 right-5 z-10 flex gap-4 items-center"
                  onClick={(e) => e.preventDefault()}
                >
                  <StarButton snippetId={snippet._id} />

                  {user?.id === snippet.userId && (
                    <button
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                        isDeleting
                          ? "bg-red-500/20 text-red-400"
                          : "bg-gray-500/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
                      }`}
                    >
                      {isDeleting ? (
                        <div className="size-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <h2 className="text-xl font-semibold text-white mb-2 line-clamp-1">
                {snippet.title}
              </h2>

              <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                <User className="size-3" />
                {snippet.userName}
              </div>

              <pre className="bg-black/30 rounded-lg p-4 text-sm text-gray-300 line-clamp-3">
                {snippet.code}
              </pre>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* ✅ FIXED CENTER MODAL USING PORTAL */}
      {showDeleteConfirm &&
        createPortal(
          <DeleteModal
            snippet={snippet}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
          />,
          document.body
        )}
    </>
  );
}

export default SnippetCard;

function DeleteModal({ snippet, onClose, onConfirm, isDeleting }: any) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[#1e1e2e] rounded-2xl p-6 shadow-2xl border border-white/[0.08] animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="text-red-400 w-5 h-5" />
          </div>

          <div>
            <h2 className="text-white font-semibold">Delete Snippet</h2>
            <p className="text-sm text-gray-400 mt-1">
              This will permanently delete{" "}
              <span className="text-white">{snippet.title}</span>.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 rounded-lg text-white"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}