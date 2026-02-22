-- ===================================
-- V27 এর সাথে SQL Table Match করার জন্য
-- Missing columns add করুন
-- SQL Editor এ run করুন
-- ===================================

-- last_device column add (V27 এটা push করে)
ALTER TABLE academy_data 
ADD COLUMN IF NOT EXISTS last_device TEXT DEFAULT '';

-- last_action column add (V27 এটা push করে)  
ALTER TABLE academy_data 
ADD COLUMN IF NOT EXISTS last_action TEXT DEFAULT '';

-- updated_by column আগে থেকেই আছে ✅
-- device_id column আগে থেকেই আছে ✅
-- version column আগে থেকেই আছে ✅

-- Verify করুন:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'academy_data' 
ORDER BY ordinal_position;

SELECT '✅ All columns ready!' as status;
