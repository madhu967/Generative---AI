import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "node:process";
import { GoogleGenAI } from "@google/genai";

const directory = fileURLToPath(new URL(".", import.meta.url));
loadEnvFile(new URL(".env", import.meta.url));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY in .env.");
}

const ai = new GoogleGenAI({ apiKey });
const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
};

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) {
      throw new Error("Request is too large.");
    }
  }
  return JSON.parse(body || "{}");
}

async function sendJson(response, status, data) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(data));
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      response.writeHead(204, {
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Origin": "*",
      });
      response.end();
      return;
    }

    if (request.method === "POST" && request.url === "/api/chat") {
      const { message, previousInteractionId, imageName } =
        await readBody(request);

      if (typeof message !== "string" || !message.trim()) {
        await sendJson(response, 400, { error: "Message cannot be empty." });
        return;
      }

      const prompt = imageName
        ? `${message}\n\n[The user attached an image named "${imageName}".]`
        : message;
      const requestBody = {
        model: "gemini-3.8-flash",
        input: prompt,
      };

      if (previousInteractionId) {
        requestBody.previous_interaction_id = previousInteractionId;
      }

      const interaction = await ai.interactions.create(requestBody);
      await sendJson(response, 200, {
        text: interaction.output_text,
        interactionId: interaction.id,
      });
      return;
    }

    if (request.method === "GET") {
      const requestedPath = request.url === "/" ? "/index.html" : request.url;
      const filePath = join(directory, requestedPath);
      const content = await readFile(filePath);
      response.writeHead(200, {
        "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      });
      response.end(content);
      return;
    }

    await sendJson(response, 404, { error: "Not found." });
  } catch (error) {
    await sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Request failed.",
    });
  }
});

server.listen(3000, () => {
  console.log("Chatbot UI available at http://localhost:3000");
});
