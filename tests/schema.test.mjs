// Validates prisma/schema.prisma with Prisma's own validator (same wasm the 5.22 CLI uses), so syntax/relation errors are caught without a DB or engine download.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const wasm = require("@prisma/prisma-schema-wasm");
const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");

test("prisma schema is valid (Prisma 5.22 validator)", () => {
  assert.doesNotThrow(() => wasm.validate(JSON.stringify({ prismaSchema: schema, noColor: true })));
});
test("schema uses multi-line blocks (single-line enum/generator blocks are invalid Prisma)", () => {
  assert.equal(/^(enum|generator|datasource|model) \w+ \{.*\}\s*$/m.test(schema), false);
});
test("all tables referenced by ledger_protections.sql exist in the schema", () => {
  const sql = readFileSync(new URL("../prisma/sql/ledger_protections.sql", import.meta.url), "utf8").replace(/--.*$/gm, "");
  for (const m of new Set([...sql.matchAll(/"([A-Z][A-Za-z]+)"/g)].map((x) => x[1]))) {
    if (["LedgerAccountType"].includes(m)) { assert.match(schema, new RegExp(`enum ${m} \\{`)); continue; }
    assert.match(schema, new RegExp(`model ${m} \\{`), `missing model ${m}`);
  }
});
