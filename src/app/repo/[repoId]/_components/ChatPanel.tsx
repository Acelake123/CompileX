"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { useRepoExplorer } from "../_context/RepoContext";
import { generateChat } from "@/config/geminiClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  message: string;
  timestamp: number;
}

interface ChatPanelProps {
  repoAnalysisId: Id<"repoAnalyses">;
}

function buildAIPrompt(
  userQuery: string,
  repoData: any,
  selectedFile: string | null
): string {
  const baseContext = `
Repository: ${repoData.metadata.name}
Owner: ${repoData.metadata.owner}
URL: ${repoData.metadata.url}
Description: ${repoData.metadata.description}

Repository Analysis:
- Summary: ${repoData.analysis.summary}
- Tech Stack: ${repoData.analysis.techStack.join(", ")}
- Key Findings: ${repoData.analysis.keyFindings}
`;

  if (selectedFile) {
    return `${baseContext}

Selected File: ${selectedFile}

You are analyzing a specific file in the repository. Answer questions ONLY about this file's content and functionality.
Keep responses focused and concise.

User Question: ${userQuery}`;
  } else {
    return `${baseContext}

Commit Activity: ${repoData.analysis.commitActivityOverview}

You are analyzing the entire repository. Provide insights about the overall project, architecture, and patterns.

User Question: ${userQuery}`;
  }
}

export default function ChatPanel({ repoAnalysisId }: ChatPanelProps) {
  const { repoData, selectedFile } = useRepoExplorer();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const saveMessage = useMutation(api.repoAnalyzer.addChatMessage);
  const chatHistory = useQuery(api.repoAnalyzer.getChatHistory, {
    repoAnalysisId,
  });

  // Load chat history
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const userMsgId = `user-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        message: userMessage,
        timestamp: Date.now(),
      },
    ]);

    try {
      const contextAwarePrompt = buildAIPrompt(userMessage, repoData, selectedFile);
      const response = await generateChat(contextAwarePrompt, 1024);

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          message: response,
          timestamp: Date.now(),
        },
      ]);

      await Promise.all([
        saveMessage({
          repoAnalysisId,
          role: "user",
          message: userMessage,
        }),
        saveMessage({
          repoAnalysisId,
          role: "assistant",
          message: response,
        }),
      ]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to generate response";
      toast.error(errorMsg);
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fileContext = selectedFile
    ? `Viewing: ${selectedFile}`
    : "Repository-wide view";

  return (
    <div className="flex flex-col h-full bg-[#12121a]/50 backdrop-blur border-b border-white/[0.05]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <h3 className="text-sm font-semibold text-white">AI Chat</h3>
          <span className="text-xs text-gray-500">({fileContext})</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Ask questions about {selectedFile ? "this file" : "the repository"}
              </p>
              <p className="text-xs text-gray-600">
                {selectedFile
                  ? "Responses will focus on this file's code"
                  : "Responses will use the full repository context"}
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-100"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="bg-gray-700 text-gray-100 px-4 py-3 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-white/[0.05]">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              selectedFile
                ? `Ask about ${selectedFile}...`
                : "Ask about the repository..."
            }
            disabled={isLoading}
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2
              text-sm text-white placeholder-gray-500
              focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50
              disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed
              text-white rounded-lg px-4 py-2 transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
