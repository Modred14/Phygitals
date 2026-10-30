// Verifies prisma/sql/ledger_protections.sql on a real Postgres engine (PGlite) using stub tables that mirror the Prisma column names.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const STUB = `
CREATE TYPE "LedgerAccountType" AS ENUM ('USER_AVAILABLE','USER_WITHDRAWAL_RESERVED','PLATFORM_TREASURY','EXTERNAL_CHAIN');
CREATE TYPE "ConfigStatus" AS ENUM ('DRAFT','VALIDATED','PUBLISHED','RETIRED');
CREATE TABLE "LedgerAccount"(id text primary key, type "LedgerAccountType" not null, "userId" text);
CREATE TABLE "LedgerEntry"(id text primary key, "transactionId" text not null, "accountId" text not null references "LedgerAccount"(id), "amountCents" bigint not null);
CREATE TABLE "RewardConfigurationVersion"(id text primary key, "packId" text not null, version int not null, "priceCents" bigint not null, status "ConfigStatus" not null);
CREATE TABLE "PackRewardTier"(id text primary key, "configId" text not null references "RewardConfigurationVersion"(id), "minCents" bigint, "maxCents" bigint, "probabilityPpm" int);
CREATE TABLE "Withdrawal"(id text primary key, "amountCents" bigint, "platformFeeCents" bigint);
INSERT INTO "LedgerAccount" VALUES ('u','USER_AVAILABLE','user1'),('ext','EXTERNAL_CHAIN',NULL),('tr','PLATFORM_TREASURY',NULL);
`;
async function fresh() { const db = new PGlite(); await db.exec(STUB); await db.exec(readFileSync(new URL("../prisma/sql/ledger_protections.sql", import.meta.url), "utf8")); return db; }
const ins = (db, id, tx, acct, amt) => db.query(`INSERT INTO "LedgerEntry" VALUES ($1,$2,$3,$4)`, [id, tx, acct, amt]);

test("balanced transaction commits; unbalanced is rejected at commit", async () => {
  const db = await fresh();
  await db.exec("BEGIN"); await ins(db, "1", "t1", "ext", -500); await ins(db, "2", "t1", "u", 500); await db.exec("COMMIT");
  await db.exec("BEGIN"); await ins(db, "3", "t2", "ext", -500); await ins(db, "4", "t2", "u", 499);
  await assert.rejects(db.exec("COMMIT"), /does not balance/); await db.exec("ROLLBACK").catch(() => {});
});
test("ledger rows cannot be updated or deleted; zero amounts rejected", async () => {
  const db = await fresh();
  await db.exec("BEGIN"); await ins(db, "1", "t1", "ext", -500); await ins(db, "2", "t1", "u", 500); await db.exec("COMMIT");
  await assert.rejects(db.exec(`UPDATE "LedgerEntry" SET "amountCents"=1 WHERE id='1'`), /immutable/);
  await assert.rejects(db.exec(`DELETE FROM "LedgerEntry"`), /immutable/);
  await assert.rejects(ins(db, "9", "t9", "u", 0), /nonzero/);
});
test("user account cannot go negative", async () => {
  const db = await fresh();
  await db.exec("BEGIN"); await ins(db, "1", "t1", "ext", -500); await ins(db, "2", "t1", "u", 500); await db.exec("COMMIT");
  await db.exec("BEGIN"); await ins(db, "3", "t2", "u", -600); await ins(db, "4", "t2", "tr", 600);
  await assert.rejects(db.exec("COMMIT"), /negative/); await db.exec("ROLLBACK").catch(() => {});
  await db.exec("BEGIN"); await ins(db, "5", "t3", "u", -500); await ins(db, "6", "t3", "tr", 500); await db.exec("COMMIT"); // exactly to zero is fine
});
test("config cannot be published unless odds total 100%, and is frozen afterwards", async () => {
  const db = await fresh();
  await db.exec(`INSERT INTO "RewardConfigurationVersion" VALUES ('c1','p',1,1000,'VALIDATED')`);
  await db.exec(`INSERT INTO "PackRewardTier" VALUES ('a','c1',100,500,600000),('b','c1',600,900,300000)`);
  await assert.rejects(db.exec(`UPDATE "RewardConfigurationVersion" SET status='PUBLISHED' WHERE id='c1'`), /do not total 100/);
  await db.exec(`INSERT INTO "PackRewardTier" VALUES ('c','c1',1000,2000,100000)`);
  await db.exec(`UPDATE "RewardConfigurationVersion" SET status='PUBLISHED' WHERE id='c1'`);
  await assert.rejects(db.exec(`UPDATE "PackRewardTier" SET "probabilityPpm"=1 WHERE id='a'`), /immutable/);
  await assert.rejects(db.exec(`DELETE FROM "PackRewardTier" WHERE id='a'`), /immutable/);
  await assert.rejects(db.exec(`UPDATE "RewardConfigurationVersion" SET "priceCents"=1 WHERE id='c1'`), /immutable/);
  await db.exec(`UPDATE "RewardConfigurationVersion" SET status='RETIRED' WHERE id='c1'`); // retiring is allowed
});
test("check constraints on tiers and withdrawals", async () => {
  const db = await fresh();
  await db.exec(`INSERT INTO "RewardConfigurationVersion" VALUES ('c2','p',2,1000,'DRAFT')`);
  await assert.rejects(db.exec(`INSERT INTO "PackRewardTier" VALUES ('x','c2',500,100,10)`), /tier_range_valid/);
  await assert.rejects(db.exec(`INSERT INTO "PackRewardTier" VALUES ('y','c2',1,2,1000001)`), /tier_ppm_range/);
  await assert.rejects(db.exec(`INSERT INTO "Withdrawal" VALUES ('w',300,300)`), /withdrawal_amounts/);
});
