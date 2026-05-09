/**
 * Gemini Client
 *
 * Google Gemini API integration for text generation.
 * Provides analysis and chat generation using Gemini models.
 * 
 * Uses @google/genai package - API key loaded from GEMINI_API_KEY env var
 */

import { GoogleGenAI } from "@google/genai";

// The client automatically loads API key from GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

/**
 * Generate text using Gemini API
 * @param prompt - The input prompt
 * @param maxTokens - Maximum tokens for response (default 2048)
 * @returns Generated text
 */
export async function generateWithGemini(
  prompt: string,
  maxTokens: number = 2048
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      console.error("Gemini: No response from API");
      throw new Error("AI_SERVICE_ERROR");
    }

    return text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Don't expose error message - return safe error code
    throw new Error("AI_SERVICE_ERROR");
  }
}

/**
 * Generate analysis using Gemini
 * @param prompt - Analysis prompt
 * @param maxTokens - Maximum tokens (default 2048)
 * @returns Generated analysis text
 */
export async function generateAnalysis(
  prompt: string,
  maxTokens: number = 2048
): Promise<string> {
  return generateWithGemini(prompt, maxTokens);
}

/**
 * Generate chat response using Gemini
 * @param prompt - Chat prompt
 * @param maxTokens - Maximum tokens (default 512)
 * @returns Generated response text
 */
export async function generateChat(
  prompt: string,
  maxTokens: number = 512
): Promise<string> {
  return generateWithGemini(prompt, maxTokens);
}
