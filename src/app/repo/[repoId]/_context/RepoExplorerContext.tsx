"use client";

import React, { createContext, useContext, useState } from "react";
import { StoredRepoAnalysis } from "@/types/repo-analyzer";

interface RepoExplorerContextType {
  repoData: StoredRepoAnalysis | null;
  selectedFile: string | null;
  setSelectedFile: (file: string | null) => void;
  isLoadingChat: boolean;
  setIsLoadingChat: (loading: boolean) => void;
}

const RepoExplorerContext = createContext<RepoExplorerContextType | undefined>(
  undefined
);

export function RepoExplorerProvider({
  children,
  repoData,
}: {
  children: React.ReactNode;
  repoData: StoredRepoAnalysis;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  return (
    <RepoExplorerContext.Provider
      value={{
        repoData,
        selectedFile,
        setSelectedFile,
        isLoadingChat,
        setIsLoadingChat,
      }}
    >
      {children}
    </RepoExplorerContext.Provider>
  );
}

export function useRepoExplorer() {
  const context = useContext(RepoExplorerContext);
  if (!context) {
    throw new Error("useRepoExplorer must be used within RepoExplorerProvider");
  }
  return context;
}
