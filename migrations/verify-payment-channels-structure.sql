-- ============================================================================
-- VERIFY: Payment Channels Table Structure
-- ============================================================================
-- Script ini memverifikasi bahwa struktur payment_channels sudah benar
-- ============================================================================

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '   VERIFICATION: Payment Channels Table Structure'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- Check if table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payment_channels'
    ) THEN
        RAISE EXCEPTION '❌ Table payment_channels does not exist!';
    ELSE
        RAISE NOTICE '✓ Table payment_channels exists';
    END IF;
END $$;

-- Check all required columns
DO $$
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
    wrong_type_columns TEXT[] := ARRAY[]::TEXT[];
    col_info RECORD;
BEGIN
    -- Check code column
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'code';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'code');
    ELSIF col_info.data_type NOT IN ('character varying', 'varchar') THEN
        wrong_type_columns := array_append(wrong_type_columns, 'code (expected VARCHAR)');
    END IF;

    -- Check name column
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'name';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'name');
    END IF;

    -- Check group_channel column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'group_channel';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'group_channel');
    END IF;

    -- Check fee_merchant_flat column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'fee_merchant_flat';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'fee_merchant_flat');
    END IF;

    -- Check fee_merchant_percent column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'fee_merchant_percent';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'fee_merchant_percent');
    END IF;

    -- Check fee_customer_flat column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'fee_customer_flat';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'fee_customer_flat');
    END IF;

    -- Check fee_customer_percent column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'fee_customer_percent';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'fee_customer_percent');
    END IF;

    -- Check minimum_amount column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'minimum_amount';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'minimum_amount');
    END IF;

    -- Check maximum_amount column (CRITICAL)
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'maximum_amount';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'maximum_amount');
    END IF;

    -- Check icon_url column
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'icon_url';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'icon_url');
    END IF;

    -- Check is_active column
    SELECT data_type INTO col_info FROM information_schema.columns
    WHERE table_name = 'payment_channels' AND column_name = 'is_active';
    IF NOT FOUND THEN
        missing_columns := array_append(missing_columns, 'is_active');
    END IF;

    -- Report results
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION '❌ Missing columns: %', array_to_string(missing_columns, ', ');
    END IF;
    
    IF array_length(wrong_type_columns, 1) > 0 THEN
        RAISE WARNING '⚠ Wrong column types: %', array_to_string(wrong_type_columns, ', ');
    END IF;

    RAISE NOTICE '✓ All required columns exist with correct types';
END $$;

-- Check for OLD columns that should NOT exist
DO $$
DECLARE
    old_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check for group_name (old name)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = 'group_name'
    ) THEN
        old_columns := array_append(old_columns, 'group_name (should be group_channel)');
    END IF;

    -- Check for fee_merchant (old JSONB)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = 'fee_merchant'
        AND data_type = 'jsonb'
    ) THEN
        old_columns := array_append(old_columns, 'fee_merchant (old JSONB, should be split)');
    END IF;

    -- Check for fee_customer (old JSONB)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = 'fee_customer'
        AND data_type = 'jsonb'
    ) THEN
        old_columns := array_append(old_columns, 'fee_customer (old JSONB, should be split)');
    END IF;

    -- Check for total_fee (should not exist)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = 'total_fee'
    ) THEN
        old_columns := array_append(old_columns, 'total_fee (should be removed)');
    END IF;

    -- Check for minimum_fee (old name)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = 'minimum_fee'
    ) THEN
        old_columns := array_append(old_columns, 'minimum_fee (should be minimum_amount)');
    END IF;

    -- Check for maximum_fee (old name)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'payment_channels' AND column_name = 'maximum_fee'
    ) THEN
        old_columns := array_append(old_columns, 'maximum_fee (should be maximum_amount)');
    END IF;

    IF array_length(old_columns, 1) > 0 THEN
        RAISE WARNING '⚠ Old columns still exist: %', array_to_string(old_columns, ', ');
        RAISE WARNING '→ Run migration: migrations/fix_payment_channels_structure_complete.sql';
    ELSE
        RAISE NOTICE '✓ No old/deprecated columns found';
    END IF;
END $$;

-- Show current table structure
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '   Current Table Structure:'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\d payment_channels

-- Show row count
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '   Data Statistics:'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
    COUNT(*) as total_channels,
    COUNT(CASE WHEN is_active THEN 1 END) as active_channels,
    COUNT(DISTINCT group_channel) as channel_groups
FROM payment_channels;

-- Show sample data
\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '   Sample Data (First 5 Channels):'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

SELECT 
    code,
    name,
    group_channel,
    fee_merchant_flat,
    fee_customer_flat,
    minimum_amount,
    maximum_amount,
    is_active
FROM payment_channels
ORDER BY group_channel, name
LIMIT 5;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '   Indexes Check:'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'

-- Check indexes exist
SELECT 
    indexname,
    tablename
FROM pg_indexes 
WHERE tablename = 'payment_channels'
ORDER BY indexname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo '   ✅ VERIFICATION COMPLETE'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

