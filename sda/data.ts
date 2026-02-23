import { SimpleDB } from "@nshiab/simple-data-analysis";

/**
 * Data preparation script for RAG system
 * This script loads, processes, and indexes data for semantic search.
 * Customize this file to scrape, download, clean, and prepare your data.
 * Requirements:
 * - A column with unique IDs
 * - A column with text content
 */

// Load environment variables shared across multiple files
const columnId = Deno.env.get("COLUMN_ID");
const columnText = Deno.env.get("COLUMN_TEXT");
const dbPath = Deno.env.get("DB_PATH");
if (!columnId || !columnText || !dbPath) {
  throw new Error(
    "COLUMN_ID, COLUMN_TEXT, and DB_PATH environment variables must be set",
  );
}

const sdb = new SimpleDB();

// Load the data from a parquet file
// Note: The table name "data" is required as the server looks for this specific table name
const table = sdb.newTable("data");
await table.loadData("sda/data/recipes.parquet");

// Create embeddings for the text column
// Embeddings are stored in `${columnText}_embeddings` for easy server access
await table.aiEmbeddings(columnText, `${columnText}_embeddings`, {
  cache: true, // Avoid re-embedding unchanged text
  verbose: true,
  ollama: true, // Force Ollama for embeddings, even if using Gemini/Vertex for the LLM
});

// Create vector similarity search index on the embedding column
await table.createVssIndex(`${columnText}_embeddings`, { verbose: true });

// Create full-text search index on the text column for faster BM25 retrieval
await table.createFtsIndex(columnId, columnText, { verbose: true });

// Display the first row for verification
await table.logTable(1);

// Write the database to disk for the server to load
await sdb.writeDB(dbPath);

await sdb.done();
