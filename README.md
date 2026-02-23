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
I am looking for a fruity pastry for breakfast.

📝 Answer:
The only pastry in the provided data that contains fruit and would be suitable for breakfast is **Apple Pie**. It uses sliced apples (such as Granny Smith or Honeycrisp) as the main fruit ingredient.

⏱️ Query duration: 8235ms
📊 Rows searched: 10
🧠 Thinking level: minimal
🤖 Model used: gpt-oss:20b
```

You can also return just the data, before it's passed to the LLM, which is way
faster.

## How it works

1. The data is loaded and converted to vectors (embeddings)
2. When a question is asked, two things happen in parallel:

- A vector search
  - The question is converted to vectors
  - The question vectors are compared the original data vectors
  - The closest data entries are kept
- A BM25 search
  - The words in the questions are searched in the original data text
  - This search takes into accounts how many times the words are found and how
    long are the data entries
  - The most relevant data entries are kept

3. Then the results of the vector and BM25 searches are reranked to prioritize
   search results that are appearing high with both search technics.
4. The selected data entries are sent to a LLM instructed to answer the question
   based only on the provided data, reducing the risk of hallucinations.

On a technical note, indexes are created for the embeddings and for the BM25
search. Data is cached locally. The reranking is a reciprocal rank fusion (RRF).

## How to run

- Fork and then clone this repository
- Install [Deno](https://deno.com/)
- Install [Ollama](https://ollama.com/)
- Pull the [nomic-embed-text](https://ollama.com/library/nomic-embed-text) model
  for the embeddings: `ollama pull nomic-embed-text`
- Pull the [gpt-oss:20b](https://ollama.com/library/gpt-oss:20b) LLM model:
  `ollama pull gpt-oss:20b`
- Create an `.env` file from the `.env.example`

- Install all dependencies: `deno install`
- Run `deno task data` to load the data, create the embeddings and write the DB
  to disk.
- Run `deno task server` in one terminal to load and keep the DB in memory.
- Run `deno task query` in another terminal to ask a default question. The first
  time, it will load the LLM in memory. After that, it will be faster. Ollama
  keeps models in memory for 5 minutes by default.

### Query Options

All query options can be combined. Here are the available parameters:

**Basic query with custom question:**

```bash
deno task query "I am looking for a pastry with herbal flavours."
```

**Thinking level** (`-t` or `--thinking`): Controls the depth of reasoning the
LLM uses. Options: `minimal`, `low`, `medium`, `high`

```bash
deno task query "What dessert has chocolate?" -t high
```

**Number of results** (`-n` or `--numDocs`): How many semantically closest data
points to pass to the LLM (default: 10)

```bash
deno task query "What dessert has chocolate?" -n 5
```

**Endpoint** (`-e` or `--endpoint`): Choose between `query` (default - uses LLM
to answer) or `data` (returns just the search results without LLM, much faster)

```bash
# Get LLM-generated answer
deno task query "desserts with chocolate" -e query

# Get just the matching data without LLM processing
deno task query "desserts with chocolate" -e data
```

**Combined example:**

```bash
deno task query "I am looking for a pastry with herbal flavours." -t high -n 5 -e query
```

If you want to start fresh and remove the cache, run `deno task clean`.

## Questions? Comments?

Reach out to [Nael Shiab](https://naelshiab.com).
