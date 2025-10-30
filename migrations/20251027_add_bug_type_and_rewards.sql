-- ========================================
-- ADD BUG TYPE AND REWARD SYSTEM
-- ========================================
-- Migration untuk menambahkan type "bug" dan reward system
-- Created: 2025-10-27

-- 1. Update request_type constraint untuk include 'bug'
ALTER TABLE feature_requests 
DROP CONSTRAINT IF EXISTS feature_requests_request_type_check;

ALTER TABLE feature_requests
ADD CONSTRAINT feature_requests_request_type_check 
CHECK (request_type IN ('ai_model', 'feature', 'bug', 'other'));

-- 2. Add reward columns
ALTER TABLE feature_requests
ADD COLUMN IF NOT EXISTS reward_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reward_given_at TIMESTAMP;

-- 3. Create index for reward tracking
CREATE INDEX IF NOT EXISTS idx_feature_requests_reward_given ON feature_requests(reward_given);

-- 4. Add comment
COMMENT ON COLUMN feature_requests.request_type IS 'Type: ai_model, feature, bug, or other';
COMMENT ON COLUMN feature_requests.reward_amount IS 'Reward credits given to user when request is approved/implemented';
COMMENT ON COLUMN feature_requests.reward_given IS 'Whether reward has been given to user';
COMMENT ON COLUMN feature_requests.reward_given_at IS 'Timestamp when reward was given';

-- 5. Update existing stats view or create materialized view for performance (optional)
-- This helps with admin dashboard performance
CREATE OR REPLACE VIEW feature_request_stats AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'under_review') as under_review_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'implemented') as implemented_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE request_type = 'ai_model') as ai_model_count,
    COUNT(*) FILTER (WHERE request_type = 'feature') as feature_count,
    COUNT(*) FILTER (WHERE request_type = 'bug') as bug_count,
    COUNT(*) FILTER (WHERE request_type = 'other') as other_count,
    COUNT(*) FILTER (WHERE reward_given = true) as rewarded_count,
    COALESCE(SUM(reward_amount) FILTER (WHERE reward_given = true), 0) as total_rewards_given,
    COUNT(DISTINCT user_id) as unique_users
FROM feature_requests;

COMMENT ON VIEW feature_request_stats IS 'Real-time statistics for feature requests including rewards';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Bug type added to request_type';
    RAISE NOTICE '   - Reward system columns added';
    RAISE NOTICE '   - Statistics view created';
END $$;

