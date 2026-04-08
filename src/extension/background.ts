/**
 * Chrome Extension Background Script
 * Acts as the central hub for the triple-agent system.
 */
import { Orchestrator } from "../orchestrator";

console.log("Background Script: Initialized.");

let orchestrator: Orchestrator | null = null;

async function captureScreenshot(tabId: number | null = null) {
  // In a real extension:
  // return await chrome.tabs.captureVisibleTab(null, { format: "png" });
  
  // For prototype:
  console.log("Background: Capturing screenshot for tab", tabId);
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
}

// In a real extension, we'd use chrome.runtime.onMessage.
// For the prototype, we simulate the background script's behavior.
export const executeMission = async (userInput: string, mistralKey: string, profile: any, dom: string = "") => {
  if (!orchestrator) {
    orchestrator = new Orchestrator(mistralKey);
  }

  try {
    // The Orchestrator now handles the vision fallback internally via its runMission loop
    const result = await orchestrator.runMission(userInput, dom || "Current Page Context (Simulated)", profile);
    return result;
  } catch (error) {
    console.error("Background Script: Mission failed:", error);
    return { success: false, error: String(error), steps: [], finalResult: null };
  }
};

// Example listener for a real extension:
/*
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_MISSION") {
    const { userInput, mistralKey } = message;
    startMission(userInput, mistralKey).then(sendResponse);
    return true; // Keep the message channel open for async response.
  }
});
*/
