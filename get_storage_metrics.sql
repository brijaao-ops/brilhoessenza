-- Função otimizada para evitar erro "sum(text)" e garantir compatibilidade
CREATE OR REPLACE FUNCTION get_storage_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_size BIGINT := 0;
    storage_size BIGINT := 0;
    plan_db_limit BIGINT := 524288000; -- 500MB
    plan_storage_limit BIGINT := 1073741824; -- 1GB
BEGIN
    -- 1. Tamanho do Banco de Dados
    SELECT pg_database_size(current_database()) INTO db_size;

    -- 2. Tamanho do Armazenamento (Media Assets)
    -- Usamos NULLIF e cast explícito para garantir que passamos BIGINT para o SUM
    SELECT 
        COALESCE(SUM(CAST(NULLIF(metadata->>'size', '') AS BIGINT)), 0)
    INTO storage_size 
    FROM storage.objects;

    RETURN jsonb_build_object(
        'database_size', db_size,
        'database_limit', plan_db_limit,
        'storage_size', storage_size,
        'storage_limit', plan_storage_limit,
        'last_updated', now()
    );
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO service_role;
GRANT EXECUTE ON FUNCTION get_storage_metrics() TO public;
