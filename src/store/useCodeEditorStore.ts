import { CodeEditorState } from "./../types/index";
import { create } from "zustand";
import { Monaco } from "@monaco-editor/react";

const getInitialState = () => {
  // if we're on the server, return default values
  if (typeof window === "undefined") {
    return {
      language: "javascript",
      fontSize: 16,
      theme: "vs-dark",
    };
  }

  // if we're on the client, return values from local storage bc localStorage is a browser API.
  const savedLanguage = localStorage.getItem("editor-language") || "javascript";
  const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
  const savedFontSize = localStorage.getItem("editor-font-size") || 16;

  return {
    language: savedLanguage,
    theme: savedTheme,
    fontSize: Number(savedFontSize),
  };
};

export const useCodeEditorStore = create<CodeEditorState>((set, get) => {
  const initialState = getInitialState();

  return {
    ...initialState,
    output: "",
    isRunning: false,
    error: null,
    editor: null,
    executionResult: null,

    getCode: () => get().editor?.getValue() || "",

    setEditor: (editor: Monaco) => {
      const savedCode = localStorage.getItem(`editor-code-${get().language}`);
      if (savedCode) editor.setValue(savedCode);

      set({ editor });
    },

    setTheme: (theme: string) => {
      localStorage.setItem("editor-theme", theme);
      set({ theme });
    },

    setFontSize: (fontSize: number) => {
      localStorage.setItem("editor-font-size", fontSize.toString());
      set({ fontSize });
    },

    setLanguage: (language: string) => {
      // Save current language code before switching
      const currentCode = get().editor?.getValue();
      if (currentCode) {
        localStorage.setItem(`editor-code-${get().language}`, currentCode);
      }

      localStorage.setItem("editor-language", language);

      set({
        language,
        output: "",
        error: null,
      });
    },

    runCode: async (executeCodeAction: any) => {
      const { language, getCode } = get();
      const code = getCode();

      if (!code) {
        set({ error: "Please enter some code" });
        return;
      }

      set({ isRunning: true, error: null, output: "" });

      try {
        // Call OneCompiler via Convex action
        const result = await executeCodeAction({ language, code });

        // Check for output first, then error (stderr) if output is empty
        const output = result.output?.trim()
          ? result.output.trim()
          : result.error?.trim()
          ? result.error.trim()
          : "";

        // No output from either stdout or stderr
        if (!output) {
          set({
            error: "No output returned.",
            executionResult: { code, output: "", error: "No output returned." },
          });
          return;
        }

        // Has stderr/error output (error state)
        if (result.error?.trim() && !result.output?.trim()) {
          set({
            error: result.error.trim(),
            output: "",
            executionResult: { code, output: "", error: result.error.trim() },
          });
          return;
        }

        // Has stdout output (success state)
        set({
          output,
          error: null,
          executionResult: {
            code,
            output,
            error: null,
          },
        });
      } catch (error) {
        console.log("Error running code:", error);
        const errorMessage = error instanceof Error ? error.message : "Error running code";
        set({
          error: errorMessage,
          executionResult: { code, output: "", error: errorMessage },
        });
      } finally {
        set({ isRunning: false });
      }
    },
  };
});

export const getExecutionResult = () => useCodeEditorStore.getState().executionResult;
