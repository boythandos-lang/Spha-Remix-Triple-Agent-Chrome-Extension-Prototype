import { BlueAgent } from "./agents/blueAgent";
import { RedAgent } from "./agents/redAgent";
import { BlackAgent } from "./agents/blackAgent";
import { Validator } from "./validator";
import { Vision } from "./extension/vision";

/**
 * Orchestrator
 * Coordinates the triple-agent system with vision and validation.
 */
export class Orchestrator {
  private blue: BlueAgent;
  private red: RedAgent;
  private black: BlackAgent;
  private validator: Validator;
  private vision: Vision;

  constructor(mistralKey: string) {
    this.blue = new BlueAgent(mistralKey);
    this.red = new RedAgent();
    this.black = new BlackAgent();
    this.validator = new Validator(this.blue);
    this.vision = new Vision();
  }

  /**
   * Main execution loop for the triple-agent system.
   */
  async runMission(userInput: string, pageContext: string, profile: any): Promise<{ success: boolean; steps: any[]; finalResult: any }> {
    console.log(`Orchestrator: Starting mission for "${userInput}"`);
    
    // 1. Vision: Capture Screenshot
    const screenshot = await this.vision.captureScreenshot();

    // 2. Blue Agent (Reasoning): Plan with Vision
    const analysis = await this.blue.analyze(userInput, pageContext, profile, screenshot);
    console.log("Orchestrator: Blue Agent analysis complete:", analysis);
    
    const steps: any[] = [];

    // 3. RED Agent (Execution): Strictly follow the plan
    for (const step of analysis.plan) {
      try {
        const action = this.mapStepToAction(step);
        let result = await this.red.execute(action.type, action.params, pageContext);
        
        steps.push({ step, result });

        // 👁️ SMART VISION RECOVERY
        if (result.useVision) {
          console.log("Orchestrator: RED Agent requested vision. Initiating vision-based recovery...");
          
          const screenshot = await this.vision.captureScreenshot();
          const visionResponse = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agent: "vision",
              image: screenshot,
              messages: [{ role: "user", content: `Execute step: ${step}` }]
            })
          });

          if (visionResponse.ok) {
            const visionData = await visionResponse.json();
            const visionResult = JSON.parse(visionData.output);
            console.log("Orchestrator: Vision recovery successful:", visionResult);
            
            // Update result with vision-based findings
            result = {
              ...result,
              success: true,
              result: visionResult,
              error: null
            };
            
            // Update the last step in the array
            steps[steps.length - 1].result = result;
          }
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
  }

  /**
   * Helper to map a natural language step to a structured action.
   */
  private mapStepToAction(step: string): { type: string; params: any } {
    const lowerStep = step.toLowerCase();
    
    // Improved mapping for profile-based actions
    if (lowerStep.includes("click") || lowerStep.includes("select")) {
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
