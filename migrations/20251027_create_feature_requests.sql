-- ========================================
-- FEATURE REQUESTS TABLE
-- ========================================
-- Table untuk menyimpan request model AI atau fitur dari user
-- Created: 2025-10-27

CREATE TABLE IF NOT EXISTS feature_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Request Details
    request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('ai_model', 'feature', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    use_case TEXT, -- Optional: Untuk apa user butuh ini?
    
    -- Request Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'implemented')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Admin Response
    admin_response TEXT,
    admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    
    -- Votes/Popularity (untuk future enhancement)
    upvotes INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT check_title_length CHECK (char_length(title) >= 5),
    CONSTRAINT check_description_length CHECK (char_length(description) >= 20)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feature_requests_user_id ON feature_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_requests_type ON feature_requests(request_type);

-- ========================================
-- FEATURE REQUEST RATE LIMITING TABLE
-- ========================================
-- Table untuk tracking rate limit per user

CREATE TABLE IF NOT EXISTS feature_request_rate_limits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT NOW(),
    last_request_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint: one record per user per time window
    CONSTRAINT unique_user_rate_limit UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_request_rate_limits_user_id ON feature_request_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_request_rate_limits_window ON feature_request_rate_limits(window_start);

-- ========================================
-- TRIGGER: Update timestamp on update
-- ========================================
CREATE OR REPLACE FUNCTION update_feature_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_request_timestamp
    BEFORE UPDATE ON feature_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_request_timestamp();

-- ========================================
-- SAMPLE DATA (Optional - for testing)
-- ========================================
COMMENT ON TABLE feature_requests IS 'Stores user requests for AI models and features';
COMMENT ON COLUMN feature_requests.request_type IS 'Type: ai_model, feature, or other';
COMMENT ON COLUMN feature_requests.status IS 'Status: pending, under_review, approved, rejected, implemented';
COMMENT ON COLUMN feature_requests.priority IS 'Priority: low, normal, high, urgent';

-- ========================================
-- GRANT PERMISSIONS (if needed)
-- ========================================
-- GRANT ALL PRIVILEGES ON feature_requests TO your_app_user;
-- GRANT ALL PRIVILEGES ON feature_request_rate_limits TO your_app_user;

