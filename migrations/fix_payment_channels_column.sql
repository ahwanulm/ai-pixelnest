-- Migration: Rename group_name to group_channel in payment_channels table
-- This fixes the column name mismatch between schema and code

-- Check if group_name exists and rename it to group_channel
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'group_name'
    ) THEN
        ALTER TABLE payment_channels 
        RENAME COLUMN group_name TO group_channel;
        
        RAISE NOTICE 'Column group_name renamed to group_channel successfully';
    ELSE
        RAISE NOTICE 'Column group_name does not exist, skipping migration';
    END IF;
END $$;

-- Add the column if it doesn't exist at all (for new deployments)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'group_channel'
    ) THEN
        ALTER TABLE payment_channels 
        ADD COLUMN group_channel VARCHAR(50) NOT NULL DEFAULT 'Other';
        
        RAISE NOTICE 'Column group_channel created successfully';
    ELSE
        RAISE NOTICE 'Column group_channel already exists';
    END IF;
END $$;

