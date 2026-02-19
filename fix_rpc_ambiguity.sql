-- Drop POTENTIAL conflicting functions to resolve ambiguity
DROP FUNCTION IF EXISTS get_order_by_token(text);
DROP FUNCTION IF EXISTS get_order_by_token(uuid);

-- Re-create the correct function expecting TEXT (since token is stored as text in our schema plan)
create or replace function get_order_by_token(token text)
returns json
language plpgsql
security definer
as $$
declare
    order_data json;
begin
    select json_build_object(
        'id', o.id,
        'customer_name', o.customer_name,
        'total', o.total,
        'status', o.status,
        'items', o.items,
        'driver', (select json_build_object(
            'name', d.name,
            'photo_url', d.photo_url,
            'vehicle_type', d.vehicle_type,
            'license_plate', d.license_plate
        ) from delivery_drivers d where d.id = o.driver_id)
    ) into order_data
    from orders o
    where o.delivery_token = token
    limit 1;

    return order_data;
end;
$$;
