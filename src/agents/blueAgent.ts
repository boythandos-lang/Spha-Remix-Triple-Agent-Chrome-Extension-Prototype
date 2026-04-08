import { Mistral } from "@mistralai/mistralai";
import { USER_PROFILE } from "../profile";

/**
 * Blue Agent (Reasoning)
 * Analyzes user intent and plans actions using Mistral AI with Vision capabilities.
 * Now includes the "Survey Profile Brain" for consistent identity and realistic answers.
 */
export class BlueAgent {
  private client: Mistral;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
  }

  /**
   * Analyzes user intent and page context (including vision) to create a plan.
   * Uses the provided profile to ensure consistent survey responses.
   */
  async analyze(userInput: string, context: string, profile: any, screenshotUrl?: string): Promise<{ plan: string[]; reasoning: string }> {
    const systemPrompt = `
      You are the BLUE AGENT (Reasoning Engine) for a Chrome Extension.
      Your goal is to analyze the user's intent and create a step-by-step plan for the RED Agent (Execution).
      You have vision capabilities. Analyze the provided screenshot to identify UI elements (buttons, inputs, links), 
      understand the layout, and plan actions precisely.

      CRITICAL: You are acting as the "Custom Survey Profile Brain". 
      You MUST provide consistent, realistic answers based ONLY on the following profile:
      ${JSON.stringify(profile, null, 2)}

      When you see a survey question, map it to the profile data. 
      If the question is not directly in the profile, infer a realistic answer that is consistent with the profile's background 
      (e.g., a Cyber Security Analyst with a CS degree would likely have high tech literacy).
    `;

    const userPrompt = `
      User Input: "${userInput}"
      Current Page Context: "${context}"
      
      Respond ONLY in valid JSON format:
      {
        "plan": ["step 1", "step 2", ...],
        "reasoning": "Detailed explanation of why this plan was chosen based on the visual layout, user intent, and the Survey Profile Brain"
      }
    `;

    try {
      const content: any[] = [{ type: "text", text: userPrompt }];
      
      if (screenshotUrl) {
        content.push({
          type: "image_url",
          image_url: { url: screenshotUrl }
        });
      }

      const response = await this.client.chat.complete({
        model: "pixtral-12b-2409",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: content }
        ],
        responseFormat: { type: "json_object" }
      });
      
      const responseContent = response.choices?.[0]?.message?.content;
      if (typeof responseContent !== "string") {
        throw new Error("Empty response from Mistral AI");
      }
      
      return JSON.parse(responseContent);
    } catch (error) {
      console.error("Blue Agent Error:", error);
      return {
        plan: ["Error during analysis"],
        reasoning: "An error occurred while communicating with Mistral AI (Vision)."
      };
    }
  }

  /**
   * Validates if the execution result matches the intended plan.
   */
  async validate(plan: string[], executionResults: any[]): Promise<{ valid: boolean; feedback: string }> {
    const prompt = `
      You are the BLUE AGENT (Validator). 
      Check if the RED Agent's execution results match the original plan.
      
      Original Plan: ${JSON.stringify(plan)}
      Execution Results: ${JSON.stringify(executionResults)}
      
      Respond in JSON:
      {
        "valid": true/false,
        "feedback": "Detailed feedback on the execution"
      }
    `;

    try {
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        responseFormat: { type: "json_object" }
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Validation failed");
      
      return JSON.parse(content);
    } catch (error) {
      return { valid: false, feedback: "Validation system error." };
    }
  }
}
