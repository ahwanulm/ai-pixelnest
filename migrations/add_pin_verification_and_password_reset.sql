-- Migration: Add PIN Verification and Password Reset Columns
-- Description: Adds all necessary columns for user activation and password reset functionality
-- Date: 2025-10-28

BEGIN;

-- ========================================
-- 1. Add Activation/PIN Verification Columns
-- ========================================

-- Activation code (6-digit PIN for email verification)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS activation_code VARCHAR(6);

-- Expiry time for activation code
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS activation_code_expires_at TIMESTAMP;

-- Track failed activation attempts
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS activation_attempts INTEGER DEFAULT 0;

-- Track when user was activated
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP;

-- Track last time activation code was resent
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_activation_resend TIMESTAMP;

-- ========================================
-- 2. Add Password Reset Columns
-- ========================================

-- Password reset code (6-digit PIN)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_code VARCHAR(6);

-- Expiry time for password reset code
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMP;

-- Track failed password reset attempts
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_attempts INTEGER DEFAULT 0;

-- ========================================
-- 3. Add Email Verification Columns (Legacy support)
-- ========================================

-- Email verification status
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Email verification token (for token-based verification)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);

-- Expiry time for email verification token
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Legacy password reset token (for token-based reset)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);

-- Legacy expiry time for password reset token
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;

-- ========================================
-- 4. Create Indexes for Performance
-- ========================================

-- Index for activation code lookups
CREATE INDEX IF NOT EXISTS idx_users_activation_code 
ON users(activation_code) 
WHERE activation_code IS NOT NULL;

-- Index for password reset code lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_code 
ON users(password_reset_code) 
WHERE password_reset_code IS NOT NULL;

-- Index for email verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token 
ON users(email_verification_token) 
WHERE email_verification_token IS NOT NULL;

-- Index for password reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
ON users(password_reset_token) 
WHERE password_reset_token IS NOT NULL;

-- Index for email verified status
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users(email_verified);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active);

-- ========================================
-- 5. Update Existing Users
-- ========================================

-- Mark existing users as email verified and activated
UPDATE users 
SET 
  email_verified = true,
  activated_at = created_at
WHERE 
  is_active = true 
  AND email_verified IS NULL 
  AND activated_at IS NULL;

COMMIT;

-- ========================================
-- Verification Query
-- ========================================

-- Run this to verify all columns were added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- AND column_name IN (
--   'activation_code', 'activation_code_expires_at', 'activation_attempts',
--   'activated_at', 'last_activation_resend',
--   'password_reset_code', 'password_reset_expires_at', 'password_reset_attempts',
--   'email_verified', 'email_verification_token', 'email_verification_expires',
--   'password_reset_token', 'password_reset_expires'
-- )
-- ORDER BY column_name;

