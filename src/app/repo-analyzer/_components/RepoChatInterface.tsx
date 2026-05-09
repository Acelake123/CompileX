"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Send, Loader, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { generateChatResponse } from "@/actions/aiAnalysis";
import React from "react";
import MarkdownContent from "@/components/MarkdownContent";
import OllamaErrorDialog from "@/components/OllamaErrorDialog";

interface ChatMessage {
  role: "user" | "assistant";
  message: string;
  _id?: string;
  _creationTime?: number;
}

interface RepoChatInterfaceProps {
  analysisId: Id<"repoAnalyses">;
}

export default function RepoChatInterface({ analysisId }: RepoChatInterfaceProps) {
  const [userMessage, setUserMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showAiErrorDialog, setShowAiErrorDialog] = useState(false);

  const messages = useQuery(api.repoAnalyzer.getChatHistory, { repoAnalysisId: analysisId });
  const analysis = useQuery(api.repoAnalyzer.getRepoAnalysis, {
    repoAnalysisId: analysisId,
  });
  const addMessage = useMutation(api.repoAnalyzer.addChatMessage);
  const clearHistory = useMutation(api.repoAnalyzer.clearChatHistory);

  // Initialization check
  useEffect(() => {
    if (messages !== undefined && analysis !== undefined) {
      setIsInitializing(false);
    }
  }, [messages, analysis]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userMessage.trim()) {
      return;
    }

    if (!analysis) {
      toast.error("Analysis data not loaded");
      return;
    }

    const messageToSend = userMessage;
    setUserMessage("");
    setIsLoading(true);

    try {
      // Add user message
      await addMessage({
        repoAnalysisId: analysisId,
        role: "user",
        message: messageToSend,
      });

      // Generate AI response
      const response = await generateChatResponse(
        messageToSend,
        analysis.analysis,
        analysis.metadata,
        (messages || []).map((m: ChatMessage) => ({ role: m.role, message: m.message }))
      );

      // Add assistant message
      await addMessage({
        repoAnalysisId: analysisId,
        role: "assistant",
        message: response,
      });
    } catch (error) {
      // Check if it's an AI service error
      if (error instanceof Error && error.message.includes("AI_SERVICE_ERROR")) {
        setShowAiErrorDialog(true);
      } else {
        // Show other errors in toast
        const errorMessage = error instanceof Error ? error.message : "Failed to send message";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear chat history?")) {
      return;
    }

    try {
      await clearHistory({ repoAnalysisId: analysisId });
      toast.success("Chat history cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  if (isInitializing) {
    return (
      <div className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-6 h-96 flex items-center justify-center">
        <Loader className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#12121a]/90 backdrop-blur rounded-xl border border-white/[0.05] p-4 flex flex-col h-full sticky top-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
        <h3 className="font-semibold text-white">Repository Chat</h3>
        {(messages || []).length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
            title="Clear chat history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {(!messages || messages.length === 0) && (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">
              Ask questions about this repository. The AI will answer based on the analysis.
            </p>
          </div>
        )}

        {(messages || []).map((message: ChatMessage, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              {message.role === "assistant" ? (
                <MarkdownContent content={message.message} compact />
              ) : (
                message.message
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-800 text-gray-200 px-3 py-2 rounded-lg flex items-center gap-2">
              <Loader className="w-3 h-3 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          placeholder="Ask about this repo..."
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 bg-[#1e1e2e] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500
            focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !userMessage.trim()}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
            rounded-lg text-white transition-colors flex items-center gap-1"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {showAiErrorDialog && (
        <OllamaErrorDialog onClose={() => setShowAiErrorDialog(false)} />
      )}
    </motion.div>
  );
}
