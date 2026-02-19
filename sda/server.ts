import { existsSync, mkdirSync } from "node:fs";
import { SimpleDB, SimpleTable } from "@nshiab/simple-data-analysis";
import { prettyDuration } from "@nshiab/journalism";

// Update these as needed
const dbPath = "sda/output/database.db";
const dataPath = "sda/data/recipes.parquet";
const columnToEmbed = "Recipe";
const modelContextWindow = 128_000; // Just for Ollama models

// Global variables to hold DB and table in memory
let sdb: SimpleDB;
let table: SimpleTable;

// Initialize DB on server startup
async function initDB() {
  const start = Date.now();
  console.log("🔄 Initializing database...");

  if (!existsSync(dbPath)) {
    console.log("📦 Creating new database...");
    if (!existsSync("sda/output")) {
      mkdirSync("sda/output", { recursive: true });
    }
    sdb = new SimpleDB({ file: dbPath });
    table = sdb.newTable("recipes");
    // Load data and create embeddings
    await table.loadData(dataPath);
    await table.aiEmbeddings(columnToEmbed, `${columnToEmbed}_embedding`, {
      cache: true,
      createIndex: true,
      verbose: true,
      // ollama: true // Uncomment if using Ollama for embeddings but Gemini for LLM
    });
    // Make sure DB is saved with embeddings index
    await sdb.done();
    console.log("✅ Database created and saved with embeddings index.");
  }

  console.log("📂 Loading existing database...");
  sdb = new SimpleDB();
  await sdb.loadDB(dbPath);
  table = await sdb.getTable("recipes");
  prettyDuration(start, {
    log: true,
    prefix: "✅ DB loaded in: ",
  });

  console.log("🚀 Server ready to handle queries!");
}

// Handle incoming HTTP requests
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // Health check endpoint
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // RAG query endpoint
  if (url.pathname === "/query" && req.method === "POST") {
    try {
      const body = await req.json();
      const { question, nbResults = 10, thinking = "minimal" } = body;

      if (!question) {
        return new Response(
          JSON.stringify({ error: "Missing 'question' field" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      console.log(`🔍 Query: "${question}" (thinking: ${thinking})`);
      const start = Date.now();

      const answer = await table.aiRAG(
        question,
        columnToEmbed,
        nbResults,
        {
          cache: true,
          verbose: true,
          thinkingLevel: thinking,
          modelContextWindow,
          // ollamaEmbeddings: true // Uncomment if using Ollama for embeddings but Gemini for LLM
        },
      );

      const duration = Date.now() - start;
      console.log(`✅ Answered in ${prettyDuration(start)}`);

      return new Response(
        JSON.stringify({
          answer,
          duration,
          nbResults,
          thinking,
          model: Deno.env.get("AI_MODEL"),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("❌ Error:", error);
      return new Response(
        JSON.stringify({ error: String(error) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  }

  // Default 404
  return new Response("Not Found", { status: 404 });
}

// Start the server
const PORT = 8000;

console.log("🔧 Starting server...");
await initDB();

Deno.serve({ port: PORT }, handler);
