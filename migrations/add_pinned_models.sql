-- Migration: Add Pinned Models Feature
-- Description: Allow users to pin up to 3 favorite models for quick access
-- Created: 2025-10-26

-- Create pinned_models table
CREATE TABLE IF NOT EXISTS pinned_models (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id INTEGER NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    pin_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure user cannot pin same model twice
    UNIQUE(user_id, model_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pinned_models_user_id ON pinned_models(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_models_model_id ON pinned_models(model_id);

-- Add constraint to limit max 3 pins per user (enforced in application logic)
-- Note: PostgreSQL doesn't support this directly, will be enforced in backend

COMMENT ON TABLE pinned_models IS 'Stores user pinned models (max 3 per user)';
COMMENT ON COLUMN pinned_models.pin_order IS 'Order of pinned models (0-2 for 3 pins)';

