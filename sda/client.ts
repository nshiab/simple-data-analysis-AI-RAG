// Simple client to query the RAG server

const SERVER_URL = "http://localhost:8000";

async function query(question: string, nbResults = 50, thinking = "minimal") {
  try {
    const response = await fetch(`${SERVER_URL}/query`, {
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

// Main execution
if (import.meta.main) {
  // Parse arguments
  const args = Deno.args;
  let nbResults = 10; // default
  let thinking = "minimal"; // default
  const questionParts: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--numDocs" || args[i] === "-n") {
      nbResults = parseInt(args[i + 1], 10);
      i++; // skip next arg
    } else if (args[i] === "--thinking" || args[i] === "-t") {
      thinking = args[i + 1];
      i++; // skip next arg
    } else {
      questionParts.push(args[i]);
    }
  }

  const question = questionParts.join(" ") ||
    "I love pastries, but I am allergic to eggs. What could I bake?";

  console.log(`\n🔍 Question:\n${question}\n`);

  const result = await query(question, nbResults, thinking);

  console.log(`\n📝 Answer:\n${result.answer}`);
  console.log(`\n⏱️  Query duration: ${result.duration}ms`);
  console.log(`📊 Rows searched: ${result.nbResults}`);
  console.log(`🧠 Thinking level: ${result.thinking}`);
  console.log(`🤖 Model used: ${result.model}\n`);
}
