import { printTable } from "@nshiab/journalism";

/**
 * Client for querying the RAG server
 */

// Server configuration
const SERVER_URL = Deno.env.get("SERVER_URL");
if (!SERVER_URL) {
  throw new Error("SERVER_URL environment variable is not set");
}

/**
 * Sends a query to the RAG server
 * @param endpoint - The endpoint to query ('query' or 'data')
 * @param question - The question or search terms to query
 * @param nbResults - Number of results to return
 * @param thinking - Thinking level for the LLM
 * @returns The query response from the server
 */
async function query(
  endpoint: "query" | "data",
  question: string,
  nbResults: number | undefined,
  thinking: "minimal" | "low" | "medium" | "high" | undefined,
) {
  try {
    const response = await fetch(`${SERVER_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, nbResults, thinking }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Error querying server:", error);
    throw error;
  }
}

// Parse command-line arguments
const args = Deno.args;
let nbResults: number | undefined;
let thinking: "minimal" | "low" | "medium" | "high" | undefined;
let endpoint: "query" | "data" = "query";
const questionParts: string[] = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--numDocs" || args[i] === "-n") {
    nbResults = parseInt(args[i + 1], 10);
    i++; // skip next arg
  } else if (args[i] === "--thinking" || args[i] === "-t") {
    const thinkingValue = args[i + 1];
    if (
      thinkingValue === "minimal" || thinkingValue === "low" ||
      thinkingValue === "medium" || thinkingValue === "high"
    ) {
      thinking = thinkingValue;
    } else {
      console.error(
        `❌ Invalid thinking level: "${thinkingValue}". Must be one of: minimal, low, medium, high`,
      );
      Deno.exit(1);
    }
    i++; // skip next arg
  } else if (args[i] === "--endpoint" || args[i] === "-e") {
    endpoint = args[i + 1] as "query" | "data";
    i++; // skip next arg
  } else {
    questionParts.push(args[i]);
  }
}

// Default question if none provided
const question = questionParts.join(" ") ||
  "I am looking for a fruity pastry for breakfast.";

if (endpoint === "query") {
  console.log(`\n🔍 Question:\n${question}\n`);
} else {
  console.log(`\n🔍 Search terms:\n${question}\n`);
}

console.log(`📡 Endpoint: /${endpoint}\n`);

const result = await query(endpoint, question, nbResults, thinking);

if (endpoint === "query") {
  console.log(`\n📝 Answer:\n${result.answer}`);
  console.log(`\n⏱️  Query duration: ${result.duration}ms`);
  console.log(`📊 Rows searched: ${result.nbResults}`);
  console.log(`🧠 Thinking level: ${result.thinking ?? "default"}`);
  console.log(`🤖 Model used: ${result.model}\n`);
} else {
  console.log(`\n📊 Data:\n`);
  printTable(result.data);
  console.log(`\n⏱️  Query duration: ${result.duration}ms`);
  console.log(`📊 Results returned: ${result.data.length}\n`);
}
