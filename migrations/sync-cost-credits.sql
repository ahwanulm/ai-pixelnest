-- Sync credits_cost data to cost_credits column
-- This fixes the inconsistency where old data uses credits_cost
-- but new code uses cost_credits

BEGIN;

-- Update cost_credits with values from credits_cost where cost_credits is NULL or 0
UPDATE ai_generation_history
SET cost_credits = COALESCE(credits_cost, 0)
WHERE cost_credits IS NULL OR cost_credits = 0;

-- Report updated rows
SELECT 
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE cost_credits > 0) as rows_with_credits,
    SUM(cost_credits) as total_credits
FROM ai_generation_history;

COMMIT;

