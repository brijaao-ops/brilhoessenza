-- Create a function to get storage and database metrics with extra safety
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
    -- 1. Get DB size
    BEGIN
        SELECT pg_database_size(current_database()) INTO db_size;
    EXCEPTION WHEN OTHERS THEN
        db_size := 0;
    END;

    -- 2. Get Storage size
    -- We try different ways to get the size for maximum compatibility
    BEGIN
        SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0) INTO storage_size FROM storage.objects;
    EXCEPTION WHEN OTHERS THEN
        BEGIN
            -- Fallback: some versions might have a direct size column
            SELECT COALESCE(SUM(size), 0) INTO storage_size FROM storage.objects;
        EXCEPTION WHEN OTHERS THEN
            storage_size := 0;
        END;
    END;

    RETURN jsonb_build_object(
        'database_size', db_size,
        'database_limit', plan_db_limit,
        'storage_size', storage_size,
        'storage_limit', plan_storage_limit,
        'last_updated', now()
    );
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO service_role;
 -- We also grant to public just in case there's an issue with the session role during initialization, 
 -- though SECURITY DEFINER handles the actual data access.
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO public;
