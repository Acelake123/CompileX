"use client";

import React, { createContext, useContext, useState } from "react";
import { RepositoryFileEntry, StoredRepoAnalysis } from "@/types/repo-analyzer";

export type RepoNodeType = "file" | "dir";

export interface SelectedNode {
  path: string;
  type: RepoNodeType;
}

interface RepoExplorerContextType {
  repoData: StoredRepoAnalysis;
  repositoryFiles: RepositoryFileEntry[];
  selectedNode: SelectedNode | null;
  setSelectedNode: (node: SelectedNode | null) => void;
  selectedFileContent: string | null;
  setSelectedFileContent: (content: string | null) => void;
  isFileLoading: boolean;
  setIsFileLoading: (loading: boolean) => void;
}

const RepoExplorerContext = createContext<RepoExplorerContextType | undefined>(
  undefined
);

export function RepoExplorerProvider({
  children,
  repoData,
  repositoryFiles,
}: {
  children: React.ReactNode;
  repoData: StoredRepoAnalysis;
  repositoryFiles: RepositoryFileEntry[];
}) {
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  return (
    <RepoExplorerContext.Provider
      value={{
        repoData,
        repositoryFiles,
        selectedNode,
        setSelectedNode,
        selectedFileContent,
        setSelectedFileContent,
        isFileLoading,
        setIsFileLoading,
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
