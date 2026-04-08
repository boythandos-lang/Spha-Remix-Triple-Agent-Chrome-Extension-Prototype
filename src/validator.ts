import { BlueAgent } from "./agents/blueAgent";

/**
 * Validation Logic
 * Uses the Blue Agent to verify if the RED Agent's execution matches the original plan.
 */
export class Validator {
  private blue: BlueAgent;

  constructor(blueAgent: BlueAgent) {
    this.blue = blueAgent;
  }

  /**
   * Validates the execution results against the plan.
   */
  async validateExecution(plan: string[], results: any[]): Promise<{ valid: boolean; feedback: string }> {
    console.log("Validator: Verifying execution results...");
    return await this.blue.validate(plan, results);
  }
}
