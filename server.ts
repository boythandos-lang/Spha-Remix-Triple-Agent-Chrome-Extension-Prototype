import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

async function runVisionAgent(task: string, imageBase64: string) {
  console.log("Vision Agent: Processing task with image...", task);
  // ⚠️ Placeholder (vision-ready structure)
  // In a real scenario, this would call Mistral Pixtral or Google Gemini Vision
  return {
    actions: [
      { type: "click", text: "Next", selector: ".next-button" }
    ],
    reasoning: "Visual analysis suggests the 'Next' button is the primary path forward."
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/agent", async (req, res) => {
    const { agent, messages, image } = req.body;

    if (image) {
      const result = await runVisionAgent(messages?.[0]?.content || "No task provided", image);
      return res.json({ output: JSON.stringify(result) });
    }

    // Default response for non-vision tasks (simulated)
    res.json({ 
      output: JSON.stringify({ 
        success: true, 
        message: `Agent ${agent} processed the request.` 
      }) 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
