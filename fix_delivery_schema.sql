-- Add delivery_token and delivery_confirmation_time to orders if they don't exist
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'delivery_token') then
        alter table orders add column delivery_token text;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'delivery_confirmation_time') then
        alter table orders add column delivery_confirmation_time timestamptz;
    end if;
end $$;

-- Enable RLS on orders if not already enabled (good practice, but assumption is it is)
alter table orders enable row level security;

-- RPC to get order by token (SECURITY DEFINER to bypass RLS for anonymous lookup)
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

-- RPC to confirm delivery (SECURITY DEFINER to allow update by anonymous user with token)
create or replace function confirm_delivery(token_input text)
returns boolean
language plpgsql
security definer
as $$
declare
    affected_rows int;
begin
    update orders
    set 
        status = 'DELIVERED',
        delivery_confirmation_time = now(),
        payment_status = 'paid' -- Assuming delivery implies payment or payment check
    where delivery_token = token_input
    and status != 'DELIVERED'; -- Prevent re-confirmation issues if strict

    get diagnostics affected_rows = row_count;

    if affected_rows > 0 then
        return true;
    else
        return false;
    end if;
end;
$$;
