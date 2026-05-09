"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { useRepoExplorer } from "../_context/RepoContext";
import { generateRepoChatResponse } from "@/actions/repoChat";
import toast from "react-hot-toast";
import MarkdownContent from "@/components/MarkdownContent";
import OllamaErrorDialog from "@/components/OllamaErrorDialog";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: number;
}

interface RepoChatPanelProps {
  repoAnalysisId: Id<"repoAnalyses">;
}

export default function RepoChatPanel({ repoAnalysisId }: RepoChatPanelProps) {
  const {
    repoData,
    repositoryFiles,
    selectedNode,
    selectedFileContent,
    isFileLoading,
  } = useRepoExplorer();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAiErrorDialog, setShowAiErrorDialog] = useState(false);

  const saveMessage = useMutation(api.repoAnalyzer.addChatMessage);
  const chatHistory = useQuery(api.repoAnalyzer.getChatHistory, {
    repoAnalysisId,
  });

  useEffect(() => {
    if (chatHistory) {
      const sortedMessages = chatHistory
        .map((msg) => ({
          id: msg._id || "",
          role: msg.role,
          message: msg.message,
          timestamp: msg._creationTime || 0,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      setMessages(sortedMessages);
    }
  }, [chatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scopeType = selectedNode?.type === "file"
    ? "file"
    : selectedNode?.type === "dir"
      ? "dir"
      : "repo";

  const scopePath = selectedNode?.path;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    // Prevent sending message while file is loading
    if (scopeType === "file" && isFileLoading) {
      toast.error("File is still loading. Please wait a moment...");
      return;
    }

    if (!repoData.repositoryId) {
      toast.error("Repository index not ready. Please re-analyze the repo.");
      return;
    }

    if (scopeType === "file" && !selectedFileContent) {
      toast.error("Load the file content first before asking about it.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", message: userMessage, timestamp: Date.now() },
    ]);

    try {
      const { response, contextFiles } = await generateRepoChatResponse({
        userMessage,
        scopeType,
        scopePath,
        repoName: repoData.metadata.name,
        repoOwner: repoData.metadata.owner,
        repoDescription: repoData.metadata.description ?? null,
        defaultBranch: repoData.metadata.defaultBranch,
        summary: repoData.analysis.summary,
        keyFindings: repoData.analysis.keyFindings,
        readme: repoData.readme ?? null,
        repositoryFiles,
        selectedFileContent,
      });

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", message: response, timestamp: Date.now() },
      ]);

      await Promise.all([
        saveMessage({
          repoAnalysisId,
          role: "user",
          message: userMessage,
          scopeType,
          scopePath,
          contextFiles,
        }),
        saveMessage({
          repoAnalysisId,
          role: "assistant",
          message: response,
          scopeType,
          scopePath,
          contextFiles,
        }),
      ]);
    } catch (error) {
      if (isOllamaConnectionError(error)) {
        setShowAiErrorDialog(true);
      } else {
        const errorMsg = error instanceof Error ? error.message : "Failed to generate response";
        toast.error(errorMsg);
        console.error("Chat error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scopeLabel =
    scopeType === "file"
      ? `File: ${scopePath}`
      : scopeType === "dir"
        ? `Dir: ${scopePath}`
        : "Repository";

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] overflow-hidden">

      {/* Scope indicator bar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#111118]/60">
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Scope</span>
        <span className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.07] text-[10px] font-mono text-gray-400 truncate">
          {scopeLabel}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 select-none">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Send className="w-4 h-4 text-gray-700" />
            </div>
            <p className="text-xs font-medium text-gray-500">Ask anything about the codebase</p>
            <p className="text-[11px] text-gray-700">
              Scope: <span className="font-mono">{scopeLabel}</span>
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center mb-0.5">
                  <span className="text-[8px] font-bold text-white">AI</span>
                </div>
              )}
              <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm break-words ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm leading-relaxed"
                    : "bg-white/[0.05] border border-white/[0.07] text-gray-200 rounded-bl-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownContent content={msg.message} compact />
                ) : (
                  msg.message
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-5 h-5 rounded-full bg-gray-600 flex-shrink-0 flex items-center justify-center mb-0.5">
                  <span className="text-[8px] font-bold text-gray-300">U</span>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center mb-0.5">
              <span className="text-[8px] font-bold text-white">AI</span>
            </div>
            <div className="bg-white/[0.05] border border-white/[0.07] px-4 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-white/[0.06]">
        <form onSubmit={handleSendMessage} className="space-y-2">
          {isFileLoading && scopeType === "file" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/[0.08] border border-blue-500/20">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
              <span className="text-xs text-blue-300 font-medium">Loading file content...</span>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isFileLoading && scopeType === "file"
                  ? "Loading file…"
                  : scopeType === "file"
                    ? `Ask about ${scopePath}…`
                    : scopeType === "dir"
                      ? `Ask about ${scopePath}…`
                      : "Ask about the repository…"
              }
              disabled={isLoading || (isFileLoading && scopeType === "file")}
              className="flex-1 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5
                text-sm text-white placeholder-gray-600
                focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/[0.12]
                hover:border-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || (isFileLoading && scopeType === "file")}
              className="w-9 h-9 flex items-center justify-center rounded-xl
                bg-blue-600 hover:bg-blue-500
                disabled:bg-white/[0.05] disabled:text-gray-600 disabled:cursor-not-allowed
                text-white transition-all duration-200 flex-shrink-0"
              title={
                isFileLoading && scopeType === "file"
                  ? "Wait for file to load"
                  : "Send message"
              }
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {showAiErrorDialog && (
        <OllamaErrorDialog onClose={() => setShowAiErrorDialog(false)} />
      )}
    </div>
  );
}
