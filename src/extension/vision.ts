/**
 * Vision Integration
 * Handles screenshot capture from the server-side browser.
 */
export class Vision {
  /**
   * Captures the current tab's screenshot by calling the server-side Browser API.
   */
  async captureScreenshot(): Promise<string> {
    console.log("Vision: Capturing real screenshot...");
    
    try {
      const response = await fetch("/api/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "screenshot", params: {} })
      });

      if (!response.ok) throw new Error("Screenshot failed");

      const data = await response.json();
      return `data:image/png;base64,${data.data}`;
    } catch (error) {
      console.error("Vision Error:", error);
      // Fallback to placeholder if browser API fails
      return "https://picsum.photos/seed/survey/1280/720";
    }
  }
}
