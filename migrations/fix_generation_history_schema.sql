-- ===================================
-- Fix ai_generation_history Schema
-- ===================================
-- Menambahkan kolom yang diperlukan untuk queue system
-- dan persistence generation tracking

-- 1. Add missing columns (IF NOT EXISTS = safe to run multiple times)
ALTER TABLE ai_generation_history 
ADD COLUMN IF NOT EXISTS job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP;

-- Note: completed_at sudah ada di schema awal

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_generation_job_id ON ai_generation_history(job_id);
CREATE INDEX IF NOT EXISTS idx_generation_status ON ai_generation_history(status);
CREATE INDEX IF NOT EXISTS idx_generation_user_status ON ai_generation_history(user_id, status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_generation_user_created ON ai_generation_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_viewed ON ai_generation_history(user_id, viewed_at) WHERE viewed_at IS NULL;

-- 3. Update existing records to have started_at if null
UPDATE ai_generation_history 
SET started_at = created_at 
WHERE started_at IS NULL;

-- 4. Verify schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'ai_generation_history'
ORDER BY ordinal_position;

-- Expected columns:
-- ✅ id (serial)
-- ✅ user_id (integer)
-- ✅ generation_type (varchar)
-- ✅ sub_type (varchar)
-- ✅ prompt (text)
-- ✅ result_url (text)
-- ✅ settings (jsonb)
-- ✅ credits_cost (integer)
-- ✅ status (varchar)
-- ✅ error_message (text)
-- ✅ created_at (timestamp)
-- ✅ completed_at (timestamp)
-- ✅ job_id (varchar) -- NEW
-- ✅ started_at (timestamp) -- NEW
-- ✅ progress (integer) -- NEW
-- ✅ viewed_at (timestamp) -- NEW

COMMENT ON COLUMN ai_generation_history.job_id IS 'Unique job ID for tracking generation across sessions';
COMMENT ON COLUMN ai_generation_history.started_at IS 'When generation was initiated';
COMMENT ON COLUMN ai_generation_history.progress IS 'Generation progress (0-100)';
COMMENT ON COLUMN ai_generation_history.viewed_at IS 'Timestamp when user viewed the result';

