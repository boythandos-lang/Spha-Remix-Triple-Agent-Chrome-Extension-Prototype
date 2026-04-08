import { BlueAgent } from "./agents/blueAgent";
import { RedAgent } from "./agents/redAgent";
import { BlackAgent } from "./agents/blackAgent";
import { GeminiAgent } from "./agents/geminiAgent";
import { Validator } from "./validator";
import { Vision } from "./extension/vision";

/**
 * Orchestrator
 * Coordinates the triple-agent system with vision and validation.
 * Now includes Gemini as the ultimate fallback.
 */
export class Orchestrator {
  private blue: BlueAgent;
  private red: RedAgent;
  private black: BlackAgent;
  private gemini: GeminiAgent;
  private validator: Validator;
  private vision: Vision;

  constructor(mistralKey: string) {
    this.blue = new BlueAgent(mistralKey);
    this.red = new RedAgent();
    this.black = new BlackAgent(mistralKey);
    this.gemini = new GeminiAgent();
    this.validator = new Validator(this.blue);
    this.vision = new Vision();
  }

  /**
   * Main execution loop for the triple-agent system.
   */
  async runMission(userInput: string, pageContext: string, profile: any): Promise<{ success: boolean; steps: any[]; finalResult: any }> {
    console.log(`Orchestrator: Starting mission for "${userInput}"`);
    
    const steps: any[] = [];
    let currentContext = pageContext;
    let screenshot = "";

    try {
      // 1. Vision: Capture Initial Screenshot
      screenshot = await this.vision.captureScreenshot();

      // 2. Blue Agent (Reasoning): Plan with Vision
      const analysis = await this.blue.analyze(userInput, currentContext, profile, screenshot);
      console.log("Orchestrator: Blue Agent analysis complete:", analysis);
      
      // 3. RED Agent (Execution): Strictly follow the plan
      for (const step of analysis.plan) {
        try {
          const action = this.mapStepToAction(step);
          let result = await this.red.execute(action.type, action.params, currentContext);
          
          steps.push({ step, result });

          // If RED agent returns new state (real navigation)
          if (result.success && result.result?.dom) {
            currentContext = result.result.dom;
            screenshot = result.result.screenshot;
          }

          // 👁️ SMART VISION RECOVERY
          if (result.useVision) {
            console.log("Orchestrator: RED Agent requested vision. Initiating vision-based recovery...");
            
            const screenshot = await this.vision.captureScreenshot();
            // In a real scenario, we'd call a vision-capable agent here
            // For now, we'll let the next step handle it or trigger Black Agent
          }

          if (!result.success && !result.useVision) {
            throw new Error(`RED Agent failed at step: ${step}. Error: ${result.error}`);
          }

          // 4. Validation: Blue Agent checks if execution matches the plan
          const validation = await this.validator.validateExecution([step], [result]);
          console.log(`Orchestrator: Validation for step "${step}":`, validation);
          
          if (!validation.valid) {
            throw new Error(`Validation failed for step: ${step}. Feedback: ${validation.feedback}`);
          }
        } catch (error) {
          // 5. Black Agent (Mission-Mode Fallback): Dominant personality handles failures
          console.error("Orchestrator: Critical failure. Calling Black Agent...");
          const fallback = await this.black.handleCriticalFailure(String(error), { step, analysis });
          
          steps.push({ step, result: { success: false, error: String(error), fallback } });
          
          // If Black Agent also fails or can't recover, we'll hit the outer catch
          if (fallback.action === "SYSTEM_SHUTDOWN") {
            throw new Error("Black Agent could not recover.");
          }

          return {
            success: false,
            steps,
            finalResult: fallback
          };
        }
      }

      return {
        success: true,
        steps,
        finalResult: "Mission accomplished successfully and validated."
      };
    } catch (outerError) {
      // 6. Gemini Agent (Ultimate Fallback): The last hope
      console.error("Orchestrator: ALL AGENTS FAILED. INITIATING ULTIMATE FALLBACK (GEMINI)...");
      const geminiResult = await this.gemini.ultimateFallback(String(outerError), { userInput, steps });
      
      return {
        success: false,
        steps,
        finalResult: {
          action: "GEMINI_ULTIMATE_FALLBACK",
          status: geminiResult.output,
          priority: "ULTIMATE"
        }
      };
    }
  }

  /**
   * Helper to map a natural language step to a structured action.
   */
  private mapStepToAction(step: string): { type: string; params: any } {
    const lowerStep = step.toLowerCase();
    
    if (lowerStep.includes("navigate to") || lowerStep.includes("go to")) {
      const url = lowerStep.match(/https?:\/\/[^\s]+/)?.[0] || "https://google.com";
      return { type: "navigate", params: { url } };
    } else if (lowerStep.includes("click") || lowerStep.includes("select")) {
      const selector = lowerStep.match(/['"](.*?)['"]/)?.[1] || ".button-primary";
      return { type: "click", params: { selector } };
    } else if (lowerStep.includes("type") || lowerStep.includes("enter")) {
      const text = lowerStep.match(/['"](.*?)['"]/)?.[1] || "Vincent";
      const selector = lowerStep.includes("into") ? lowerStep.split("into")[1].trim() : "#search-input";
      return { type: "type", params: { selector, text } };
    } else if (lowerStep.includes("scrape") || lowerStep.includes("get")) {
      return { type: "scrape", params: { selector: "h1" } };
    }
    
    return { type: "unknown", params: {} };
  }
}
