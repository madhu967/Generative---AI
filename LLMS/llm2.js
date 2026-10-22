import { loadEnvFile } from "node:process";
import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";

loadEnvFile(new URL(".env", import.meta.url));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing Gemini API key. Set GEMINI_API_KEY (or GOOGLE_API_KEY) before running this script."
  );
}

const ai = new GoogleGenAI({ apiKey });

async function Chatting(userproblem, previousInteractionId) {
  const request = {
    model: "gemini-3.8-flash",
    input: userproblem,
  };

  if (previousInteractionId) {
    request.previous_interaction_id = previousInteractionId;
  }

  return ai.interactions.create(request);
}

async function main() {
  let previousInteractionId;

  while (true) {
    const userproblem = readlineSync.question("You: ");

    if (userproblem.trim().toLowerCase() === "exit") {
      break;
    }

    const interaction = await Chatting(userproblem, previousInteractionId);
    console.log(`Gemini: ${interaction.output_text}`);
    previousInteractionId = interaction.id;
  }
}

await main();