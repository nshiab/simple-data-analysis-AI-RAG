# AI RAG search with the Simple Data Analysis Library

This repository shows how to use the
[simple-data-analysis](https://github.com/nshiab/simple-data-analysis),
maintained by [Nael Shiab](https://naelshiab.com), to set up a free and
open-source local RAG search, which allows you to search your data using natural
language.

The default dataset is a list of AI-generated recipes. Here's an example query
and result.

```
🔍 Question:
I love pastries, but I am allergic to eggs. What could I bake?


📝 Answer:
I found that the only pastry recipes in the data that do not call for eggs are **scones** and **Qatayef**.  

- **Scones** use flour, sugar, baking powder, salt, cold butter, milk or cream, and optional vanilla.  
- **Qatayef** use flour, baking powder, salt, water, milk, sugar, yeast, and a filling of cheese, nuts, or cream; no eggs are listed.

Both can be made without any egg ingredients, so they would be suitable options for you to bake while avoiding eggs.

⏱️ Query duration: 9873ms
📊 Rows searched: 10
🧠 Thinking level: minimal
🤖 Model used: gpt-oss:20b
```

## How it works

1. The data is loaded and converted to vectors (embeddings)
2. When a question is asked, the question is converted to vectors as well
3. The vectors are lists of numbers that are compared to find the data points
   that are the closest semantically to the question
4. The closest data points are sent to a LLM instructed to answer the question
   based only on the provided data, reducing the risk of hallucinations.

## How to run

- Clone this repository
- Install [Deno](https://deno.com/)
- Install [Ollama](https://ollama.com/)
- Pull the [nomic-embed-text](https://ollama.com/library/nomic-embed-text) model
  for the embeddings: `ollama pull nomic-embed-text`
- Pull the [gpt-oss:20b](https://ollama.com/library/gpt-oss:20b) LLM model:
  `ollama pull gpt-oss:20b`
- Create an `.env` file in the repository with the following:

```bash
OLLAMA=true
AI_MODEL=gpt-oss:20b # Feel free to test others
AI_EMBEDDINGS_MODEL=nomic-embed-text # Feel free to test others
```

- Install all dependencies: `deno install`
- Run `deno task server` in one terminal to load and keep the DB in memory. The
  first time it runs, it will take longer to create, cache and index the
  vectors. After that, it will be very fast.
- Run `deno task query` in another terminal to ask a default question. The first
  time, it will load the LLM in memory. After that, it will be faster. Ollama
  keeps models in memory for 5 minutes by default.

To run custom queries:

- Rerun the query command with your question at the end, like so:
  `deno task query "I am looking for a pastry with herbal flavours."`
- You can specify the thinking level to be either `low` (default), `medium` or
  `high`:
  `deno task query "I am looking for a pastry with herbal flavours." -t high`
- You can specify how many of the semantically closest data points you want to
  pass to the LLM (default is 10):
  `deno task query "I am looking for a pastry with herbal flavours." -t high -n 5`

If you want to have a look at the data, run `deno task sda` to run `main.ts` in
watch mode. You can also use this script to create/process new data and write to
disk. Then update the variables at the beginning of `server.ts` to use your
dataset.

If you want to start fresh and remove the cache, run `deno task clean`.

## Using APIs

If you want to use Gemini or Vertex, update your `.env` with these values:

```bash
AI_KEY=your_key # For Gemini
AI_MODEL=gemini-3-flash-preview # Needs a thinking model for now
AI_PROJECT=your_project # For Vertex
AI_LOCATION=your_project_location # For Vertex
AI_EMBEDDINGS_MODEL=gemini-embedding-001 # Or other
```

For Vertex, you'll need to be authenticated with
[Google Cloud CLI on your machine](https://docs.cloud.google.com/docs/authentication/gcloud).

If you want to use an Ollama embedding model but a Gemini LLM, set the
`ollamaEmbeddings` option to `true` for the `aiRag()` method.

For more information, check the
[simple-data-analysis documentation](https://jsr.io/@nshiab/simple-data-analysis),
more specifically the
[aiRAG method](https://jsr.io/@nshiab/simple-data-analysis/doc/~/SimpleTable.prototype.aiRAG).

## Questions? Comments?

Reach out to [Nael Shiab](https://naelshiab.com).
