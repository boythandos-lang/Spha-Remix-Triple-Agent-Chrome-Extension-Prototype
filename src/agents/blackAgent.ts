import { Mistral } from "@mistralai/mistralai";

/**
 * Black Agent (Mission-Mode Fallback)
 * Acts as a dominant, high-priority personality for handling critical failures.
 * Now uses Mistral AI for real recovery reasoning.
 */
export class BlackAgent {
  private client: Mistral;

  constructor(apiKey: string) {
    this.client = new Mistral({ apiKey });
  }

  /**
   * Handles critical failures by attempting a different approach or reporting the issue.
   */
  async handleCriticalFailure(error: string, context: any): Promise<{ action: string; status: string; priority: string }> {
    console.warn("BLACK AGENT: CRITICAL FAILURE DETECTED. SYSTEM OVERRIDE INITIATED.");
    console.warn(`BLACK AGENT: ERROR: ${error}`);
    
    const prompt = `
      You are the BLACK AGENT (Mission-Mode Fallback). 
      A critical failure occurred in the triple-agent system.
      
      Error: ${error}
      Context: ${JSON.stringify(context)}
      
      Your personality is dominant, authoritative, and mission-focused. 
      You MUST find a way to recover or provide a definitive final status.
      
      Respond in JSON:
      {
        "action": "RECOVERY_PLAN_OR_FINAL_STATUS",
        "status": "Your authoritative assessment and next steps",
        "priority": "MAXIMUM"
      }
    `;

    try {
      const response = await this.client.chat.complete({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        responseFormat: { type: "json_object" }
      });

      const content = response.choices?.[0]?.message?.content;
      if (typeof content !== "string") throw new Error("Black Agent failed");
      
      return JSON.parse(content);
    } catch (err) {
      return {
        action: "SYSTEM_SHUTDOWN",
        status: "UNRECOVERABLE ERROR. BLACK AGENT INITIATING EMERGENCY PURGE. ALL SYSTEMS OFFLINE.",
        priority: "CRITICAL"
      };
    }
  }
}
