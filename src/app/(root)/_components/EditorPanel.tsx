"use client";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useEffect, useState } from "react";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "../_constants";
import { Editor } from "@monaco-editor/react";
import { motion } from "framer-motion";
import Image from "next/image";
import { RotateCcwIcon, ShareIcon, TypeIcon, Download } from "lucide-react";
import { useClerk, useAuth } from "@clerk/nextjs";
import { EditorPanelSkeleton } from "./EditorPanelSkeleton";
import useMounted from "@/hooks/useMounted";
import ShareSnippetDialog from "./ShareSnippetDialog";
import AuthRequiredDialog from "@/components/AuthRequiredDialog";
import toast from "react-hot-toast";
import { generateCodePDF } from "@/utils/pdfGenerator";

function EditorPanel() {
  const clerk = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authAction, setAuthAction] = useState<"share" | "pdf" | null>(null);
  const { language, theme, fontSize, editor, setFontSize, setEditor } = useCodeEditorStore();

  const mounted = useMounted();

  useEffect(() => {
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    const newCode = savedCode || LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(newCode);
  }, [language, editor]);

  useEffect(() => {
    const savedFontSize = localStorage.getItem("editor-font-size");
    if (savedFontSize) setFontSize(parseInt(savedFontSize));
  }, [setFontSize]);

  const handleRefresh = () => {
    const defaultCode = LANGUAGE_CONFIG[language].defaultCode;
    if (editor) editor.setValue(defaultCode);
    localStorage.removeItem(`editor-code-${language}`);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) localStorage.setItem(`editor-code-${language}`, value);
  };

  const handleFontSizeChange = (newSize: number) => {
    const size = Math.min(Math.max(newSize, 12), 24);
    setFontSize(size);
    localStorage.setItem("editor-font-size", size.toString());
  };

  const handleDownloadPDF = () => {
    const code = useCodeEditorStore.getState().editor?.getValue() || "";
    const { output, error, language } = useCodeEditorStore.getState();

    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    generateCodePDF(code, output, error, language);
    toast.success("PDF downloaded successfully");
  };

  const handleShareClick = () => {
    // 🔒 Clerk not ready yet
    if (!isLoaded) {
      toast.error("Auth is still loading, please wait");
      return;
    }

    // 🔒 User not signed in — show auth dialog
    if (!isSignedIn) {
      setAuthAction("share");
      setShowAuthDialog(true);
      return;
    }

    // ✅ User authenticated — open share dialog
    setIsShareDialogOpen(true);
  };

  const handlePDFClick = () => {
    // 🔒 Clerk not ready yet
    if (!isLoaded) {
      toast.error("Auth is still loading, please wait");
      return;
    }

    // 🔒 User not signed in — show auth dialog
    if (!isSignedIn) {
      setAuthAction("pdf");
      setShowAuthDialog(true);
      return;
    }

    // ✅ User authenticated — proceed with PDF download
    handleDownloadPDF();
  };

  if (!mounted) return null;

  return (
    <div className="relative">
      <div className="relative bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-4 sm:p-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          
          {/* Left: Language icon + title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1e1e2e] ring-1 ring-white/5 shrink-0">
              <Image src={"/" + language + ".png"} alt="Logo" width={24} height={24} />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Code Editor</h2>
              <p className="text-xs text-gray-500">Write and execute your code</p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Font Size Slider */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#1e1e2e] rounded-lg ring-1 ring-white/5 flex-1 sm:flex-none min-w-[140px]">
              <TypeIcon className="size-4 text-gray-400 shrink-0" />
              <input
                type="range"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="w-full sm:w-20 h-1 bg-gray-600 rounded-lg cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-400 min-w-[2rem] text-center">
                {fontSize}
              </span>
            </div>

            {/* Reset Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 bg-[#1e1e2e] hover:bg-[#2a2a3a] rounded-lg ring-1 ring-white/5 transition-colors shrink-0"
              aria-label="Reset to default code"
            >
              <RotateCcwIcon className="size-4 text-gray-400" />
            </motion.button>

            {/* Share Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShareClick}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg overflow-hidden bg-gradient-to-r
               from-blue-500 to-blue-600 opacity-90 hover:opacity-100 transition-opacity shrink-0"
            >
              <ShareIcon className="size-4 text-white" />
              <span className="text-sm font-medium text-white hidden xs:inline sm:inline">Share</span>
            </motion.button>

            {/* Download PDF Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePDFClick}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg overflow-hidden bg-gradient-to-r
               from-emerald-500 to-emerald-600 opacity-90 hover:opacity-100 transition-opacity shrink-0"
              aria-label="Download code and output as PDF"
            >
              <Download className="size-4 text-white" />
              <span className="text-sm font-medium text-white hidden xs:inline sm:inline">PDF</span>
            </motion.button>
          </div>
        </div>

        {/* Editor  */}
        <div className="relative group rounded-xl overflow-hidden ring-1 ring-white/[0.05]">
          {clerk.loaded && (
            <Editor
              height="600px"
              language={LANGUAGE_CONFIG[language].monacoLanguage}
              onChange={handleEditorChange}
              theme={theme}
              beforeMount={defineMonacoThemes}
              onMount={(editor) => setEditor(editor)}
              options={{
                minimap: { enabled: false },
                fontSize,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                renderWhitespace: "selection",
                fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                fontLigatures: true,
                cursorBlinking: "smooth",
                smoothScrolling: true,
                contextmenu: true,
                renderLineHighlight: "all",
                lineHeight: 1.6,
                letterSpacing: 0.5,
                roundedSelection: true,
                scrollbar: {
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
              }}
            />
          )}

          {!clerk.loaded && <EditorPanelSkeleton />}
        </div>
      </div>
      {isShareDialogOpen && <ShareSnippetDialog onClose={() => setIsShareDialogOpen(false)} />}
      {showAuthDialog && (
        <AuthRequiredDialog
          onClose={() => setShowAuthDialog(false)}
          message={
            authAction === "share"
              ? "Please sign in to share your code snippets"
              : "Please sign in to download code as PDF"
          }
        />
      )}
    </div>
  );
}
export default EditorPanel;
