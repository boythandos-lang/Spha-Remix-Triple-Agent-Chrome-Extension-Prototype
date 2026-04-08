/**
 * RED Agent (Execution)
 * Executes browser interactions using Playwright-like logic.
 * MUST always return results in valid JSON format.
 */
export class RedAgent {
  /**
   * Executes a specific action on the page by calling the server-side Browser API.
   */
  async execute(action: string, params: any, dom: string = ""): Promise<{ success: boolean; result: any; error: string | null; timestamp: string; useVision?: boolean }> {
    console.log(`RED Agent: Executing real action "${action}" with params:`, params);
    
    try {
      const response = await fetch("/api/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, params })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Browser API failed");
      }

      const data = await response.json();

      return {
        success: true,
        result: data.data,
        error: null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("RED Agent Execution Error:", error);
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        useVision: true // Trigger vision on failure
      };
    }
  }
}
