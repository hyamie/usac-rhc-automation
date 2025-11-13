-- Check current clinics_pending_review table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'clinics_pending_review'
ORDER BY ordinal_position;

-- Also check if the view 'clinics' exists
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name IN ('clinics', 'clinics_pending_review');
