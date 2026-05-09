"use client";

import { useAuth } from "@clerk/nextjs";
import { Id } from "../../convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Star } from "lucide-react";
import { useState } from "react";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";

function StarButton({ snippetId }: { snippetId: Id<"snippets"> }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const isStarred = useQuery(
    api.snippets.isSnippetStarred,
    isLoaded && isSignedIn ? { snippetId } : "skip"
  );

  const starCount = useQuery(api.snippets.getSnippetStarCount, { snippetId });
  const toggleStar = useMutation(api.snippets.starSnippet);

  const handleStar = async () => {
    // 🔒 Clerk not ready yet
    if (!isLoaded) return;

    // 🔒 User not signed in — show auth dialog
    if (!isSignedIn) {
      setShowAuthDialog(true);
      return;
    }

    // ✅ User authenticated — proceed with starring
    await toggleStar({ snippetId });
  };

  return (
    <>
      <button
        disabled={!isLoaded}
        onClick={handleStar}
        className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg
          transition-all duration-200 ${
            isStarred
              ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
              : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
          }`}
      >
        <Star
          className={`w-4 h-4 ${
            isStarred ? "fill-yellow-500" : "fill-none group-hover:fill-gray-400"
          }`}
        />
        <span className="text-xs font-medium">{starCount ?? 0}</span>
      </button>

      
      {showAuthDialog && (
        <AuthRequiredDialog   
          onClose={() => setShowAuthDialog(false)}
          message="Please sign in to star snippets"
        />
      )}
    </>
  );
}

export default StarButton;
