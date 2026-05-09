"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Map our language IDs to OneCompiler language IDs
const LANGUAGE_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  go: "go",
  rust: "rust",
  cpp: "cpp",
  csharp: "csharp",
  ruby: "ruby",
  swift: "swift",
};

// Get file extension for each language
const FILE_EXTENSIONS: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  java: "java",
  go: "go",
  rust: "rs",
  cpp: "cpp",
  csharp: "cs",
  ruby: "rb",
  swift: "swift",
};

export const executeCode = action({
  args: {
    language: v.string(),
    code: v.string(),
  },
  handler: async (_, args) => {
    const { language, code } = args;

    // Get OneCompiler API key from environment
    const apiKey = process.env.ONECOMPILER_API_KEY;
    if (!apiKey) {
      throw new Error("ONECOMPILER_API_KEY is not configured in environment");
    }

    // Map language ID
    const oneCompilerLanguage = LANGUAGE_MAP[language];
    if (!oneCompilerLanguage) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Get file extension
    const fileExtension = FILE_EXTENSIONS[language];
    const fileName = `main.${fileExtension}`;

    try {
      // Make request to OneCompiler API
      const response = await fetch("https://api.onecompiler.com/v1/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          language: oneCompilerLanguage,
          files: [
            {
              name: fileName,
              content: code,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `OneCompiler API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      }

      const result = await response.json();

      // Normalize response format to match expected output structure
      return {
        success: result.status === "success" || result.statusCode === 200,
        output: result.stdout || result.output || "",
        error: result.stderr || result.error || null,
        executionTime: result.executionTime || 0,
      };
    } catch (error) {
      console.error("Code execution error:", error);
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Unknown error occurred",
        executionTime: 0,
      };
    }
  },
});
