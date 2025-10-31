-- Migration: Add NEW badge support columns to ai_models table
-- Date: 2025-10-31
-- Purpose: Add columns to support NEW badge feature for highlighting recently added models

-- Add show_new_badge column (boolean, default false)
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS show_new_badge BOOLEAN DEFAULT FALSE;

-- Add new_badge_until column (timestamp for expiry date)
ALTER TABLE ai_models 
ADD COLUMN IF NOT EXISTS new_badge_until TIMESTAMP NULL;

-- Add comments for documentation
COMMENT ON COLUMN ai_models.show_new_badge IS 'Whether to show NEW badge on model card in dashboard';
COMMENT ON COLUMN ai_models.new_badge_until IS 'Expiry date for NEW badge (badge hidden after this date)';

-- Create index for faster expiry checks (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_new_badge_expiry 
ON ai_models (show_new_badge, new_badge_until) 
WHERE show_new_badge = true;

-- Display success message
SELECT 'NEW badge columns added successfully to ai_models table!' AS result;
