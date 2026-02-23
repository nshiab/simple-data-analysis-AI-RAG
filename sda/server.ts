import { SimpleDB, SimpleTable } from "@nshiab/simple-data-analysis";
import { prettyDuration } from "@nshiab/journalism";

/**
 * Server that keeps the database in memory and handles RAG queries from clients.
 * Note: You must run the `data.ts` script first to create the database file.
 */

// Request body interfaces
interface QueryRequest {
  question: string;
  nbResults?: number;
  thinking?: "minimal" | "low" | "medium" | "high";
}

interface DataRequest {
  question: string;
  nbResults?: number;
}

// Global variables to hold the DB and table in memory
let sdb: SimpleDB;
let table: SimpleTable;

/**
 * Initializes the database by loading it from disk into memory
 */
async function initDB(): Promise<void> {
  // Retrieve environment variables
  const dbPath = Deno.env.get("DB_PATH");
  if (!dbPath) {
    throw new Error("DB_PATH environment variable is not set");
  }

  const start = Date.now();
  console.log("📂 Loading database...");
  sdb = new SimpleDB();
  await sdb.loadDB(dbPath);
  table = await sdb.getTable("data");
  prettyDuration(start, {
    log: true,
    prefix: "✅ DB loaded in: ",
  });

  console.log("🚀 Server ready to handle queries!");
}

/**
 * Handles incoming HTTP requests for RAG queries and data retrieval
 * @param req - The incoming HTTP request
 * @returns Response with the query result or error
 */
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  // RAG query endpoint
  if (url.pathname === "/query" && req.method === "POST") {
    try {
      const body: QueryRequest = await req.json();
      const { question, nbResults = 10, thinking } = body;

      if (!question) {
        return new Response(
          JSON.stringify({ error: "Missing 'question' field" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      console.log(
        `🔍 Query: "${question}" (nbResults: ${nbResults}, model: ${
          Deno.env.get("AI_MODEL")
        }, thinking: ${thinking ?? "default"})`,
      );
      const start = Date.now();

      // Retrieve environment variables
      const columnId = Deno.env.get("COLUMN_ID");
      const columnText = Deno.env.get("COLUMN_TEXT");
      if (!columnId || !columnText) {
        throw new Error(
          "COLUMN_ID and COLUMN_TEXT environment variables must be set",
        );
      }

      // Optional parameter
      const modelContextWindow = Deno.env.get("MODEL_CONTEXT_WINDOW")
        ? parseInt(Deno.env.get("MODEL_CONTEXT_WINDOW") as string)
        : undefined;

      const answer = await table.aiRAG(
        question,
        columnId,
        columnText,
        nbResults,
        {
          cache: true,
          verbose: true,
          thinkingLevel: thinking,
          modelContextWindow,
          ollamaEmbeddings: true, // This forces to use Ollama embeddings even if using Gemini/Vertex for the LLM
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

  // Data endpoint
  if (url.pathname === "/data" && req.method === "POST") {
    try {
      const body: DataRequest = await req.json();
      const { question, nbResults = 10 } = body;

      if (!question) {
        return new Response(
          JSON.stringify({ error: "Missing 'question' field" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      console.log(
        `📊 Data query: "${question}" (nbResults: ${nbResults})`,
      );
      const start = Date.now();

      // Retrieve environment variables
      const columnId = Deno.env.get("COLUMN_ID");
      const columnText = Deno.env.get("COLUMN_TEXT");
      if (!columnId || !columnText) {
        throw new Error(
          "COLUMN_ID and COLUMN_TEXT environment variables must be set",
        );
      }

      // Optional parameter
      const modelContextWindow = Deno.env.get("MODEL_CONTEXT_WINDOW")
        ? parseInt(Deno.env.get("MODEL_CONTEXT_WINDOW") as string)
        : undefined;

      // Get similar documents using vector search
      const resultsTable = await table.hybridSearch(
        question,
        columnId,
        columnText,
        nbResults,
        {
          cache: true,
          verbose: true,
          embeddingsModelContextWindow: modelContextWindow,
          ollamaEmbeddings: true, // This forces to use Ollama embeddings even if using Gemini/Vertex for the LLM
          outputTable: `${table.name}_search_results`,
        },
      );

      const results = await resultsTable.getData();
      await resultsTable.removeTable();

      const duration = Date.now() - start;
      console.log(`✅ Data retrieved in ${prettyDuration(start)}`);

      return new Response(
        JSON.stringify({
          data: results,
          duration,
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
const SERVER_URL = Deno.env.get("SERVER_URL");
if (!SERVER_URL) {
  throw new Error("SERVER_URL environment variable is not set");
}
const serverUrl = new URL(SERVER_URL);
const PORT = parseInt(serverUrl.port) || 8000;
const HOSTNAME = serverUrl.hostname;

console.log("🔧 Starting server...");
await initDB();
console.log(`🌐 Server listening on ${SERVER_URL}`);

Deno.serve({ port: PORT, hostname: HOSTNAME }, handler);
