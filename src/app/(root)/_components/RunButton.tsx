"use client";

import { useState } from "react";
import { getExecutionResult, useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useAuth } from "@clerk/nextjs";
import { useAction, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { Loader2, Play } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import toast from "react-hot-toast";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";

function RunButton() {
  const { isLoaded, isSignedIn } = useAuth();
  const { runCode, language, isRunning } = useCodeEditorStore();
  const executeCode = useAction(api.codeExecution.executeCode);
  const saveExecution = useMutation(api.codeExecutions.saveExecution);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleRun = async () => {
    // 🔒 Clerk not ready yet
    if (!isLoaded) {
      toast.error("Auth is still loading, please wait");
      return;
    }

    // 🔒 User not signed in — show auth dialog instead of toast
    if (!isSignedIn) {
      setShowAuthDialog(true);
      return;
    }

    await runCode(executeCode);
    const result = getExecutionResult();
    if (!result) return;

    try {
      await saveExecution({
        language,
        code: result.code,
        output: result.output || undefined,
        error: result.error || undefined,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save execution");
    }
  };

  return (
    <>
      <motion.button
        onClick={handleRun}
        disabled={isRunning}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="group relative inline-flex items-center gap-2.5 px-5 py-2.5
          disabled:cursor-not-allowed focus:outline-none"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl opacity-100 transition-opacity group-hover:opacity-90" />

        <div className="relative flex items-center gap-2.5">
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white/70" />
              <span className="text-sm font-medium text-white/90">
                Executing...
              </span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-white/90 group-hover:scale-110" />
              <span className="text-sm font-medium text-white/90">
                Run Code
              </span>
            </>
          )}
        </div>
      </motion.button>

      {showAuthDialog && (
        <AuthRequiredDialog onClose={() => setShowAuthDialog(false)} />
      )}
    </>
  );
}

export default RunButton;
