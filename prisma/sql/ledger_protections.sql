-- Database-level financial protections. Apply AFTER the Prisma init migration (see docs/DEPLOYMENT.md, step "Migrations").
-- Application code already enforces these rules; this makes the database refuse violations even if app code has a bug.

-- 1) Ledger entries are immutable and never zero.
ALTER TABLE "LedgerEntry" ADD CONSTRAINT ledger_entry_nonzero CHECK ("amountCents" <> 0);

CREATE OR REPLACE FUNCTION ledger_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'LedgerEntry rows are immutable'; END $$ LANGUAGE plpgsql;
CREATE TRIGGER ledger_entry_no_update BEFORE UPDATE OR DELETE ON "LedgerEntry" FOR EACH ROW EXECUTE FUNCTION ledger_immutable();

-- 2) Double-entry: every transaction must sum to zero, checked at COMMIT.
CREATE OR REPLACE FUNCTION ledger_check_balanced() RETURNS trigger AS $$
BEGIN
  IF (SELECT COALESCE(SUM("amountCents"), 0) FROM "LedgerEntry" WHERE "transactionId" = NEW."transactionId") <> 0 THEN
    RAISE EXCEPTION 'ledger transaction % does not balance', NEW."transactionId";
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER ledger_entry_balanced AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_check_balanced();

-- 3) User money accounts can never go negative (checked at COMMIT).
CREATE OR REPLACE FUNCTION ledger_user_nonneg() RETURNS trigger AS $$
DECLARE t text; s bigint;
BEGIN
  SELECT type::text INTO t FROM "LedgerAccount" WHERE id = NEW."accountId";
  IF t IN ('USER_AVAILABLE', 'USER_WITHDRAWAL_RESERVED') THEN
    SELECT COALESCE(SUM("amountCents"), 0) INTO s FROM "LedgerEntry" WHERE "accountId" = NEW."accountId";
    IF s < 0 THEN RAISE EXCEPTION 'account % would go negative', NEW."accountId"; END IF;
  END IF;
  RETURN NULL;
END $$ LANGUAGE plpgsql;
CREATE CONSTRAINT TRIGGER ledger_user_nonneg_chk AFTER INSERT ON "LedgerEntry"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledger_user_nonneg();

-- 4) Sanity checks on odds and withdrawals.
ALTER TABLE "PackRewardTier" ADD CONSTRAINT tier_ppm_range CHECK ("probabilityPpm" BETWEEN 0 AND 1000000);
ALTER TABLE "PackRewardTier" ADD CONSTRAINT tier_range_valid CHECK ("minCents" >= 0 AND "maxCents" >= "minCents");
ALTER TABLE "Withdrawal" ADD CONSTRAINT withdrawal_amounts CHECK ("platformFeeCents" >= 0 AND "amountCents" > "platformFeeCents");

-- 5) Odds cannot be published unless they total exactly 100%, and published/retired odds are frozen.
CREATE OR REPLACE FUNCTION config_publish_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'PUBLISHED' AND OLD.status IS DISTINCT FROM 'PUBLISHED' THEN
    IF (SELECT COALESCE(SUM("probabilityPpm"), 0) FROM "PackRewardTier" WHERE "configId" = NEW.id) <> 1000000 THEN
      RAISE EXCEPTION 'cannot publish config %: odds do not total 100%%', NEW.id;
    END IF;
  END IF;
  IF OLD.status IN ('PUBLISHED', 'RETIRED') AND (NEW."priceCents" <> OLD."priceCents" OR NEW."packId" <> OLD."packId" OR NEW.version <> OLD.version) THEN
    RAISE EXCEPTION 'published configuration % is immutable', OLD.id;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER config_publish_guard_trg BEFORE UPDATE ON "RewardConfigurationVersion" FOR EACH ROW EXECUTE FUNCTION config_publish_guard();

CREATE OR REPLACE FUNCTION tier_frozen_guard() RETURNS trigger AS $$
DECLARE st text; cid text;
BEGIN
  cid := COALESCE(NEW."configId", OLD."configId");
  SELECT status::text INTO st FROM "RewardConfigurationVersion" WHERE id = cid;
  IF st IN ('PUBLISHED', 'RETIRED') THEN RAISE EXCEPTION 'tiers of a published configuration are immutable'; END IF;
  RETURN COALESCE(NEW, OLD);
END $$ LANGUAGE plpgsql;
CREATE TRIGGER tier_frozen_guard_trg BEFORE INSERT OR UPDATE OR DELETE ON "PackRewardTier" FOR EACH ROW EXECUTE FUNCTION tier_frozen_guard();
