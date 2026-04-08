import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { chromium, Browser, Page } from "playwright";

let browser: Browser | null = null;
let page: Page | null = null;

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

async function getPage() {
  const b = await getBrowser();
  if (!page) {
    const context = await b.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    });
    page = await context.newPage();
  }
  return page;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // Browser Control API
  app.post("/api/browser", async (req, res) => {
    const { action, params } = req.body;
    console.log(`Browser API: Executing ${action}`, params);

    try {
      const p = await getPage();

      switch (action) {
        case "navigate":
          await p.goto(params.url, { waitUntil: "networkidle" });
          break;
        case "click":
          await p.click(params.selector, { timeout: 5000 });
          break;
        case "type":
          await p.fill(params.selector, params.text, { timeout: 5000 });
          break;
        case "scrape":
          const content = await p.content();
          return res.json({ success: true, data: content });
        case "screenshot":
          const buffer = await p.screenshot({ type: "png" });
          return res.json({ success: true, data: buffer.toString("base64") });
        default:
          return res.status(400).json({ success: false, error: "Unknown action" });
      }

      // After navigation/click/type, return new state
      const newContent = await p.content();
      const screenshot = await p.screenshot({ type: "png" });
      
      res.json({ 
        success: true, 
        data: {
          dom: newContent,
          screenshot: screenshot.toString("base64")
        }
      });
    } catch (error) {
      console.error("Browser API Error:", error);
      res.status(500).json({ success: false, error: String(error) });
    }
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
