import { SimpleDB } from "@nshiab/simple-data-analysis";

// Simple script to see/wrangle the data.

const sdb = new SimpleDB();

const table = sdb.newTable("recipes");
await table.loadData("sda/data/recipes.parquet");
await table.logTable();

await sdb.done();
