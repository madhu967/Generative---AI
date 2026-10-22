import { loadEnvFile } from "node:process";
import { GoogleGenAI } from "@google/genai";
import readlineSync from "readline-sync";

loadEnvFile(new URL(".env", import.meta.url));

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing Gemini API key. Set GEMINI_API_KEY or GOOGLE_API_KEY before running this script."
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

  console.log("Chatbot started. Type exit or quit to stop.");

  while (true) {
    const userproblem = readlineSync.question("You: ");
    const command = userproblem.trim().toLowerCase();

    if (command === "exit" || command === "quit") {
      break;
    }

    if (!userproblem.trim()) {
      console.log("Please enter a message.");
      continue;
    }

    try {
      const interaction = await Chatting(
        userproblem,
        previousInteractionId
      );

      console.log(`Gemini: ${interaction.output_text}`);
      previousInteractionId = interaction.id;
    } catch (error) {
      console.error(
        "Request failed:",
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log("Chatbot stopped.");
}

await main();