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

console.log("Sending request to Gemini...");

const history = [];

async function Chatting(userproblem) {
  history.push({
    role: "user",
    parts: [{ text: userproblem }],
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: history,
  });

  console.log(response.text);
  history.push({
    role: "model",
    parts: [{ text: response.text }],
  });
}

async function main() {
  const userproblem = readlineSync.question(
    "Please enter your problem statement: "
  );

  await Chatting(userproblem);
  main();
}

await main();