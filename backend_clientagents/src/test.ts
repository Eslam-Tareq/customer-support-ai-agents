import { Agent, run } from '@openai/agents';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  console.log("Starting SDK Verification...");
  console.log("API Key loaded:", process.env.OPENAI_API_KEY ? "Yes" : "No");

  const testAgent = new Agent({
    name: "TestAgent",
    model: "gpt-4o-mini",
    instructions: "Answer short questions."
  });

  try {
    const result1 = await run(testAgent, "Hello, my name is Eslam.");
    console.log("\n--- Turn 1 Successful ---");
    console.log("Turn 1 Output:", result1.finalOutput);

    // Turn 2: Append new user message to history
    // We check if history items are serializable and how they look
    console.log("History item types:", result1.history.map((h: any) => `${h.role || h.type}: ${h.constructor?.name || typeof h}`));
    console.log("History JSON stringified:", JSON.stringify(result1.history));

    const historyWithNewMessage = [
      ...result1.history,
      { role: "user" as const, content: "What is my name?" }
    ];

    const result2 = await run(testAgent, historyWithNewMessage);
    console.log("\n--- Turn 2 Successful ---");
    console.log("Turn 2 Output:", result2.finalOutput);
    
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

test();
