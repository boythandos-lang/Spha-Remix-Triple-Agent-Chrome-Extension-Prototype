import { GoogleGenAI } from "@google/genai";

/**
 * Gemini Agent (Ultimate Fallback)
 * The final model in the line. If all other agents fail, Gemini is called.
 */
export class GeminiAgent {
  private ai: GoogleGenAI;

  constructor() {
    // API key is handled via process.env.GEMINI_API_KEY in this environment
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  /**
   * Final attempt to salvage the mission.
   */
  async ultimateFallback(error: string, context: any): Promise<{ success: boolean; output: string }> {
    console.warn("GEMINI AGENT: ULTIMATE FALLBACK INITIATED.");
    
    const prompt = `
      You are the GEMINI AGENT, the ultimate fallback for a multi-agent system.
      All other agents (Blue, Red, Black) have failed.
      
      Critical Error: ${error}
      Mission Context: ${JSON.stringify(context)}
      
      Analyze the situation and provide a final, creative solution or a detailed explanation of why the mission is impossible.
      You are the last hope.
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      return {
        success: true,
        output: response.text || "Gemini could not generate a response."
      };
    } catch (err) {
      console.error("Gemini Agent Error:", err);
      return {
        success: false,
        output: "Even the ultimate fallback has failed. Mission terminated."
      };
    }
  }
}
