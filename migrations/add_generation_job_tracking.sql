-- Migration: Add Job Tracking for Background Generation
-- This allows users to see progress even after page navigation

-- Add job tracking columns
ALTER TABLE ai_generation_history 
ADD COLUMN IF NOT EXISTS job_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP;

-- Update status column to support pending state
-- Existing: 'completed', 'failed'
-- New: 'pending', 'processing'

-- Create index for fast job lookup
CREATE INDEX IF NOT EXISTS idx_generation_job_id ON ai_generation_history(job_id);
CREATE INDEX IF NOT EXISTS idx_generation_status ON ai_generation_history(status);
CREATE INDEX IF NOT EXISTS idx_generation_user_pending ON ai_generation_history(user_id, status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_generation_viewed ON ai_generation_history(user_id, viewed_at) WHERE viewed_at IS NULL;

-- Function to get active jobs for user
CREATE OR REPLACE FUNCTION get_active_generations(p_user_id INTEGER)
RETURNS TABLE (
  id INTEGER,
  job_id VARCHAR,
  generation_type VARCHAR,
  sub_type VARCHAR,
  prompt TEXT,
  status VARCHAR,
  progress INTEGER,
  started_at TIMESTAMP,
  settings JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.job_id,
    g.generation_type,
    g.sub_type,
    g.prompt,
    g.status,
    g.progress,
    g.started_at,
    g.settings
  FROM ai_generation_history g
  WHERE g.user_id = p_user_id
    AND g.status IN ('pending', 'processing')
  ORDER BY g.started_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to count new generations (unviewed)
CREATE OR REPLACE FUNCTION count_new_generations(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO new_count
  FROM ai_generation_history
  WHERE user_id = p_user_id
    AND viewed_at IS NULL
    AND status = 'completed';
    
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Mark generations as viewed
CREATE OR REPLACE FUNCTION mark_generations_viewed(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE ai_generation_history
  SET viewed_at = NOW()
  WHERE user_id = p_user_id
    AND viewed_at IS NULL
    AND status = 'completed';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON COLUMN ai_generation_history.job_id IS 'Unique job ID for tracking generation across sessions';
COMMENT ON COLUMN ai_generation_history.progress IS 'Generation progress (0-100)';
COMMENT ON COLUMN ai_generation_history.viewed_at IS 'Timestamp when user viewed the result';
COMMENT ON COLUMN ai_generation_history.started_at IS 'When generation was initiated';
COMMENT ON COLUMN ai_generation_history.completed_at IS 'When generation completed';

