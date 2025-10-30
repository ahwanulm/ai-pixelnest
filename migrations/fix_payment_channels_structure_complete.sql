-- ============================================================================
-- COMPLETE FIX: Payment Channels Table Structure
-- ============================================================================
-- This migration fixes all column mismatches in payment_channels table
-- to match the structure expected by tripayService.js
-- ============================================================================

BEGIN;

-- Step 1: Check current table structure
DO $$
BEGIN
    RAISE NOTICE 'Starting payment_channels structure migration...';
END $$;

-- Step 2: Rename group_name to group_channel (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'group_name'
    ) THEN
        ALTER TABLE payment_channels RENAME COLUMN group_name TO group_channel;
        RAISE NOTICE '✓ Renamed group_name to group_channel';
    ELSE
        RAISE NOTICE '○ group_channel already exists or group_name not found';
    END IF;
END $$;

-- Step 3: Add group_channel if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'group_channel'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN group_channel VARCHAR(50) NOT NULL DEFAULT 'Other';
        RAISE NOTICE '✓ Added group_channel column';
    ELSE
        RAISE NOTICE '○ group_channel column already exists';
    END IF;
END $$;

-- Step 4: Drop old JSONB fee columns if they exist
DO $$
BEGIN
    -- Drop fee_merchant if it's JSONB
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'fee_merchant'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE payment_channels DROP COLUMN fee_merchant;
        RAISE NOTICE '✓ Dropped old fee_merchant JSONB column';
    END IF;
    
    -- Drop fee_customer if it's JSONB
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'fee_customer'
        AND data_type = 'jsonb'
    ) THEN
        ALTER TABLE payment_channels DROP COLUMN fee_customer;
        RAISE NOTICE '✓ Dropped old fee_customer JSONB column';
    END IF;
    
    -- Drop total_fee if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_channels' 
        AND column_name = 'total_fee'
    ) THEN
        ALTER TABLE payment_channels DROP COLUMN total_fee;
        RAISE NOTICE '✓ Dropped old total_fee column';
    END IF;
END $$;

-- Step 5: Add new fee columns
DO $$
BEGIN
    -- Add fee_merchant_flat
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'fee_merchant_flat'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN fee_merchant_flat INTEGER DEFAULT 0;
        RAISE NOTICE '✓ Added fee_merchant_flat';
    END IF;
    
    -- Add fee_merchant_percent
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'fee_merchant_percent'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN fee_merchant_percent DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE '✓ Added fee_merchant_percent';
    END IF;
    
    -- Add fee_customer_flat
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'fee_customer_flat'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN fee_customer_flat INTEGER DEFAULT 0;
        RAISE NOTICE '✓ Added fee_customer_flat';
    END IF;
    
    -- Add fee_customer_percent
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'fee_customer_percent'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN fee_customer_percent DECIMAL(5,2) DEFAULT 0;
        RAISE NOTICE '✓ Added fee_customer_percent';
    END IF;
END $$;

-- Step 6: Rename minimum_fee to minimum_amount
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'minimum_fee'
    ) THEN
        ALTER TABLE payment_channels RENAME COLUMN minimum_fee TO minimum_amount;
        RAISE NOTICE '✓ Renamed minimum_fee to minimum_amount';
    END IF;
END $$;

-- Step 7: Add minimum_amount if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'minimum_amount'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN minimum_amount INTEGER DEFAULT 10000;
        RAISE NOTICE '✓ Added minimum_amount';
    END IF;
END $$;

-- Step 8: Rename maximum_fee to maximum_amount
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'maximum_fee'
    ) THEN
        ALTER TABLE payment_channels RENAME COLUMN maximum_fee TO maximum_amount;
        RAISE NOTICE '✓ Renamed maximum_fee to maximum_amount';
    END IF;
END $$;

-- Step 9: Add maximum_amount if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'maximum_amount'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN maximum_amount INTEGER DEFAULT 0;
        RAISE NOTICE '✓ Added maximum_amount';
    END IF;
END $$;

-- Step 10: Ensure settings column exists (for additional config)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_channels' AND column_name = 'settings'
    ) THEN
        ALTER TABLE payment_channels ADD COLUMN settings JSONB;
        RAISE NOTICE '✓ Added settings column';
    END IF;
END $$;

-- Step 11: Final verification
DO $$
DECLARE
    missing_columns TEXT[];
    col_name TEXT;
BEGIN
    -- Check for all required columns
    SELECT ARRAY_AGG(col) INTO missing_columns
    FROM (
        SELECT 'code' AS col
        UNION SELECT 'name'
        UNION SELECT 'group_channel'
        UNION SELECT 'fee_merchant_flat'
        UNION SELECT 'fee_merchant_percent'
        UNION SELECT 'fee_customer_flat'
        UNION SELECT 'fee_customer_percent'
        UNION SELECT 'minimum_amount'
        UNION SELECT 'maximum_amount'
        UNION SELECT 'icon_url'
        UNION SELECT 'is_active'
    ) required
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = required.col
    );
    
    IF missing_columns IS NOT NULL THEN
        RAISE EXCEPTION 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE '✅ Migration completed successfully!';
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
        RAISE NOTICE 'All required columns are present:';
        RAISE NOTICE '  ✓ code, name, group_channel';
        RAISE NOTICE '  ✓ fee_merchant_flat, fee_merchant_percent';
        RAISE NOTICE '  ✓ fee_customer_flat, fee_customer_percent';
        RAISE NOTICE '  ✓ minimum_amount, maximum_amount';
        RAISE NOTICE '  ✓ icon_url, is_active';
        RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    END IF;
END $$;

COMMIT;

-- Step 12: Create/Update indexes for better performance
DO $$
BEGIN
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'Creating indexes for better query performance...';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

-- Payment Channels indexes
CREATE INDEX IF NOT EXISTS idx_payment_channels_code ON payment_channels(code);
CREATE INDEX IF NOT EXISTS idx_payment_channels_active ON payment_channels(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_channels_group ON payment_channels(group_channel);

-- Payment Transactions indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_reference ON payment_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment_transactions(created_at DESC);

DO $$
BEGIN
    RAISE NOTICE '✓ Indexes created successfully';
END $$;

-- Show final table structure
\d payment_channels

