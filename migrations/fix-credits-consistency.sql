-- ============================================
-- FIX: Credits Column Consistency in ai_generation_history
-- ============================================
-- Problem: Multiple columns for same purpose (credits_cost, cost_credits)
-- Solution: Standardize on cost_credits (DECIMAL for fractional support)
-- ============================================

BEGIN;

-- Step 1: Ensure cost_credits column exists with correct type
ALTER TABLE ai_generation_history 
ADD COLUMN IF NOT EXISTS cost_credits DECIMAL(10, 2) DEFAULT 0;

-- Step 2: Sync all data from credits_cost to cost_credits
UPDATE ai_generation_history
SET cost_credits = COALESCE(credits_cost, cost_credits, 0)
WHERE cost_credits IS NULL OR cost_credits = 0;

-- Step 3: Ensure credits_cost is also DECIMAL for consistency
ALTER TABLE ai_generation_history 
ALTER COLUMN credits_cost TYPE DECIMAL(10, 2) USING COALESCE(credits_cost, 0)::DECIMAL(10, 2);

-- Step 4: Create trigger to keep both columns in sync (for backward compatibility)
-- This ensures any old code that still uses credits_cost will work
CREATE OR REPLACE FUNCTION sync_credits_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If cost_credits is set, sync to credits_cost
  IF NEW.cost_credits IS NOT NULL THEN
    NEW.credits_cost = NEW.cost_credits;
  END IF;
  
  -- If credits_cost is set but cost_credits is not, sync from credits_cost
  IF NEW.credits_cost IS NOT NULL AND NEW.cost_credits IS NULL THEN
    NEW.cost_credits = NEW.credits_cost;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (to avoid errors on re-run)
DROP TRIGGER IF EXISTS sync_credits_trigger ON ai_generation_history;

-- Create trigger
CREATE TRIGGER sync_credits_trigger
  BEFORE INSERT OR UPDATE ON ai_generation_history
  FOR EACH ROW
  EXECUTE FUNCTION sync_credits_columns();

-- Step 5: Verify data
DO $$
DECLARE
  total_rows INTEGER;
  rows_with_credits INTEGER;
  total_credits DECIMAL;
BEGIN
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE cost_credits > 0),
    SUM(cost_credits)
  INTO total_rows, rows_with_credits, total_credits
  FROM ai_generation_history;
  
  RAISE NOTICE '✅ Migration Complete!';
  RAISE NOTICE '   Total rows: %', total_rows;
  RAISE NOTICE '   Rows with credits: %', rows_with_credits;
  RAISE NOTICE '   Total credits: %', ROUND(total_credits, 2);
END $$;

COMMIT;

-- ============================================
-- ✅ RESULT:
-- - cost_credits is the PRIMARY column (DECIMAL)
-- - credits_cost is kept for backward compatibility (DECIMAL)
-- - Both columns stay in sync automatically via trigger
-- - All new code should use cost_credits
-- ============================================

