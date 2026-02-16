-- ===================================
-- SUPABASE DATABASE SETUP SCRIPT
-- Wings Fly Aviation Academy
-- Multi-Device Sync System
-- ===================================

-- 1. DROP EXISTING TABLE (if you want fresh start)
-- DROP TABLE IF EXISTS app_data CASCADE;

-- 2. CREATE APP_DATA TABLE
CREATE TABLE IF NOT EXISTS app_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- 3. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_app_data_user_id ON app_data(user_id);
CREATE INDEX IF NOT EXISTS idx_app_data_updated_at ON app_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_data_created_at ON app_data(created_at DESC);

-- 4. CREATE UPDATE TRIGGER (Auto-update updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_data_updated_at 
    BEFORE UPDATE ON app_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

-- 6. CREATE POLICIES

-- Allow all operations (simple setup - no authentication required)
DROP POLICY IF EXISTS "Allow all operations" ON app_data;
CREATE POLICY "Allow all operations" ON app_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Alternative: Authenticated users only (uncomment if you want more security)
-- DROP POLICY IF EXISTS "Allow authenticated users" ON app_data;
-- CREATE POLICY "Allow authenticated users" ON app_data
--     FOR ALL
--     USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');

-- 7. GRANT PERMISSIONS
GRANT ALL ON app_data TO postgres;
GRANT ALL ON app_data TO anon;
GRANT ALL ON app_data TO authenticated;
GRANT ALL ON app_data TO service_role;

-- 8. ENABLE REALTIME (Very Important!)
-- Note: This needs to be done in Supabase Dashboard UI as well
-- Dashboard -> Database -> Replication -> Enable "app_data" table

-- 9. INSERT INITIAL TEST DATA (Optional)
-- INSERT INTO app_data (user_id, data, updated_at) 
-- VALUES (
--     'admin',
--     '{"students": [], "finances": [], "courses": [], "employees": [], "banks": [], "mobiles": []}'::jsonb,
--     NOW()
-- )
-- ON CONFLICT (user_id) DO NOTHING;

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'app_data'
) AS table_exists;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'app_data';

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'app_data';

-- Check current data
SELECT 
    id,
    user_id,
    updated_at,
    created_at,
    jsonb_object_keys(data) as data_keys
FROM app_data;

-- ===================================
-- UTILITY QUERIES
-- ===================================

-- Get latest update timestamp
SELECT 
    user_id,
    updated_at,
    created_at
FROM app_data
WHERE user_id = 'admin'
ORDER BY updated_at DESC
LIMIT 1;

-- Check data size
SELECT 
    user_id,
    pg_size_pretty(pg_column_size(data)) as data_size,
    jsonb_array_length(data->'students') as student_count,
    jsonb_array_length(data->'finances') as finance_count,
    updated_at
FROM app_data
WHERE user_id = 'admin';

-- ===================================
-- MAINTENANCE QUERIES
-- ===================================

-- Backup data (before any major changes)
-- CREATE TABLE app_data_backup AS SELECT * FROM app_data;

-- Restore from backup
-- TRUNCATE app_data;
-- INSERT INTO app_data SELECT * FROM app_data_backup;

-- Clear all data (DANGEROUS!)
-- DELETE FROM app_data WHERE user_id = 'admin';

-- ===================================
-- PERFORMANCE MONITORING
-- ===================================

-- Check table size
SELECT 
    pg_size_pretty(pg_total_relation_size('app_data')) as total_size,
    pg_size_pretty(pg_relation_size('app_data')) as table_size,
    pg_size_pretty(pg_indexes_size('app_data')) as indexes_size;

-- Check recent updates
SELECT 
    user_id,
    updated_at,
    created_at,
    AGE(NOW(), updated_at) as time_since_update
FROM app_data
ORDER BY updated_at DESC
LIMIT 10;

-- ===================================
-- SETUP COMPLETE! ✅
-- ===================================

-- Next Steps:
-- 1. Enable Realtime in Supabase Dashboard
--    Dashboard -> Database -> Replication -> Enable "app_data"
-- 2. Deploy your updated JavaScript files
-- 3. Test the sync functionality
-- 4. Monitor the logs in browser console

SELECT 'Database setup completed successfully!' as status;
