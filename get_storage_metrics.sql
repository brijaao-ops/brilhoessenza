-- Create a function to get storage and database metrics
CREATE OR REPLACE FUNCTION get_storage_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_size BIGINT;
    storage_size BIGINT;
    plan_db_limit BIGINT := 524288000; -- 500MB (Free Plan default)
    plan_storage_limit BIGINT := 1073741824; -- 1GB (Free Plan default)
BEGIN
    -- Get DB size in bytes
    SELECT pg_database_size(current_database()) INTO db_size;

    -- Get total storage size in bytes from storage.objects
    SELECT COALESCE(SUM(metadata->>'size')::BIGINT, 0) INTO storage_size FROM storage.objects;

    RETURN jsonb_build_object(
        'database_size', db_size,
        'database_limit', plan_db_limit,
        'storage_size', storage_size,
        'storage_limit', plan_storage_limit,
        'last_updated', now()
    );
END;
$$;

-- Grant access to authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO service_role;
