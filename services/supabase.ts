import { createClient } from '@supabase/supabase-js';
import { Product, Order, Category, Slide, UserProfile, UserPermissions, DeliveryDriver, VideoSlide } from '../types';
export type { UserProfile, UserPermissions };

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Authentication ---

export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    if (error) throw error;
    return data;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
};

// ... types and imports
// removed extra createClient

// ... existing client setup

// --- Team & Permissions ---

// Access Control helper
export const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.warn("Profile fetch error (might be first login):", error);
        return null;
    }
    return data as UserProfile;
};

// Admin function to create employee
export const createEmployee = async (email: string, password: string, name: string, permissions: UserPermissions) => {
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    let userId = '';

    try {
        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name }
            }
        });

        if (authError) {
            if (authError.message.includes("already registered") || authError.status === 422) {
                throw new Error("Este email já está cadastrado no sistema. Por favor, peça para o funcionário fazer login. Se o erro 'Perfil não encontrado' persistir, exclua o funcionário da lista (se visível) ou contate o suporte.");
            }
            throw authError;
        }

        if (!authData.user) throw new Error("Falha ao criar usuário (sem dados retornados)");
        userId = authData.user.id;

    } catch (err: any) {
        if (err.message.includes("already registered")) {
            throw new Error("Funcionário já existe! Tente excluí-lo da lista (se aparecer) ou use outro email.");
        }
        throw err;
    }

    const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
            id: userId,
            email: email,
            full_name: name,
            role: 'employee',
            permissions: permissions,
            is_first_login: true,
            is_active: true
        }]);

    if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Usuário criado, mas falha ao criar perfil: " + profileError.message);
    }

    return { id: userId, email };
};

export const fetchTeam = async () => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserProfile[];
};

export const updateEmployeeProfile = async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) throw error;
};

// ... existing helper
export const updateEmployeePermissions = async (userId: string, permissions: UserPermissions) => {
    await updateEmployeeProfile(userId, { permissions });
};

// Mark Helper
export const markFirstLoginComplete = async (userId: string) => {
    const { error } = await supabase
        .from('profiles')
        .update({ is_first_login: false })
        .eq('id', userId);

    if (error) throw error;
};

export const deleteEmployee = async (userId: string) => {
    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

    if (error) throw error;
};

export const updateUserPassword = async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    return data;
};

// --- Products ---

export const fetchProducts = async (limit?: number): Promise<Product[]> => {
    // Attempt with join first
    let query = supabase
        .from('products')
        .select(`
            *,
            product_images (*)
        `)
        .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    let { data, error } = await query;

    // Fallback if the join fails
    if (error) {
        console.warn('Fallback triggered for products fetch:', error.message);
        let fallbackQuery = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (limit) fallbackQuery = fallbackQuery.limit(limit);
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;

        if (fallbackError) {
            console.error('Critical fetch error:', fallbackError);
            throw fallbackError;
        }
        data = fallbackData;
    }

    if (!data) return [];

    // Map database fields to application interface (handling both snake_case and camelCase for safety)
    return data.map((p: any) => {
        // Handle potential naming variations for the joined images
        // Supabase/PostgREST might return it as 'product_images' or 'images' depending on the query/aliasing
        let rawImages = p.product_images || p.images || [];

        // Debugging: if you see this in console, it helps identify the structure
        if (Array.isArray(rawImages) && rawImages.length > 0) {
            console.log(`Product ${p.name} has ${rawImages.length} images.`);
        }

        return {
            ...p,
            price: Number(p.price || 0),
            costPrice: Number(p.cost_price || p.costPrice || 0),
            reviewsCount: Number(p.reviews_count || p.reviewsCount || 0),
            subCategory: p.sub_category || p.subCategory,
            bestSeller: typeof p.best_seller !== 'undefined' ? p.best_seller : p.bestSeller,
            createdAt: p.created_at || p.createdAt,
            salePrice: (p.sale_price !== undefined || p.salePrice !== undefined)
                ? Number(p.sale_price ?? p.salePrice)
                : undefined,
            deliveryCommission: Number(p.delivery_commission || p.deliveryCommission || 0),
            createdByName: p.created_by_name || p.createdByName,
            lastEditedBy: p.last_edited_by || p.lastEditedBy,
            stock: Number(p.stock || 0),
            rating: Number(p.rating || 5),
            images: Array.isArray(rawImages)
                ? [...rawImages].sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                : []
        };
    });
};

export const addProduct = async (product: Omit<Product, 'id'>) => {
    // Convert application camelCase to database snake_case
    const dbProduct = {
        name: product.name,
        price: product.price,
        cost_price: product.costPrice,
        rating: product.rating,
        reviews_count: product.reviewsCount,
        category: product.category,
        sub_category: product.subCategory,
        image: product.image,
        description: product.description,
        stock: product.stock,
        best_seller: product.bestSeller,
        created_by_name: product.createdByName,
        gender: product.gender,
        notes: product.notes,
        sale_price: product.salePrice,
        delivery_commission: product.deliveryCommission || 0,
        last_edited_by: product.lastEditedBy
    };

    const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

    if (error) throw error;

    // Handle multiple images if present
    if (product.images && product.images.length > 0) {
        const productImages = product.images.map((img, index) => ({
            product_id: data.id,
            url: img.url,
            is_main: img.is_main,
            order_index: index
        }));

        const { error: imgError } = await supabase
            .from('product_images')
            .insert(productImages);

        if (imgError) {
            console.error('Error adding product images:', imgError);
        }
    }

    // Return the "re-mapped" product including images
    return {
        ...product,
        id: data.id,
        createdAt: data.created_at
    };
};

export const updateProduct = async (id: string, product: Partial<Product>) => {
    // Convert application camelCase to database snake_case
    const dbProduct: any = {};
    if (product.name !== undefined) dbProduct.name = product.name;
    if (product.price !== undefined) dbProduct.price = product.price;
    if (product.salePrice !== undefined) dbProduct.sale_price = product.salePrice;
    if (product.costPrice !== undefined) dbProduct.cost_price = product.costPrice;
    if (product.category !== undefined) dbProduct.category = product.category;
    if (product.subCategory !== undefined) dbProduct.sub_category = product.subCategory;
    if (product.image !== undefined) dbProduct.image = product.image;
    if (product.description !== undefined) dbProduct.description = product.description;
    if (product.stock !== undefined) dbProduct.stock = product.stock;
    if (product.bestSeller !== undefined) dbProduct.best_seller = product.bestSeller;
    if (product.createdByName !== undefined) dbProduct.created_by_name = product.createdByName;
    if (product.notes !== undefined) dbProduct.notes = product.notes;
    if (product.gender !== undefined) dbProduct.gender = product.gender;
    if (product.deliveryCommission !== undefined) dbProduct.delivery_commission = product.deliveryCommission;
    if (product.lastEditedBy !== undefined) dbProduct.last_edited_by = product.lastEditedBy;

    const { error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', id);

    if (error) throw error;

    // Synchronize images if present
    if (product.images !== undefined) {
        // Simple approach: delete all and re-insert
        await supabase
            .from('product_images')
            .delete()
            .eq('product_id', id);

        if (product.images.length > 0) {
            const productImages = product.images.map((img, index) => ({
                product_id: id,
                url: img.url,
                is_main: img.is_main,
                order_index: index
            }));

            const { error: imgError } = await supabase
                .from('product_images')
                .insert(productImages);

            if (imgError) {
                console.error('Error updating product images:', imgError);
            }
        }
    }

    return product;
};

export const deleteProduct = async (id: string) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Orders ---

export const fetchOrders = async (limit?: number, days?: number): Promise<Order[]> => {
    let query = supabase
        .from('orders')
        .select('*, driver:delivery_drivers(*)')
        .order('created_at', { ascending: false });

    if (days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        query = query.gte('created_at', date.toISOString());
    }

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }

    return (data || []).map((o: any) => ({
        ...o,
        customer: o.customer || o.customer_name,
        amount: Number(o.amount || o.total || 0),
        productId: o.product_id || o.productId,
    }));
};

export const fetchOrdersByDriver = async (driverId: string): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching driver orders:', error);
        throw error;
    }

    return (data || []).map((o: any) => ({
        ...o,
        customer: o.customer || o.customer_name,
        amount: Number(o.amount || o.total || 0),
        productId: o.product_id || o.productId,
    }));
};

export const createOrder = async (order: Order) => {
    // Generate a proper UUID for the DB - the DB id column has no default
    const dbId = crypto.randomUUID();

    // Map field names to real DB column names
    const dbOrder: any = {
        id: dbId,
        customer: order.customer,
        phone: order.phone,
        amount: order.amount,
        status: order.status,
        date: order.date,
        time: order.time,
        address: order.address,
        neighborhood: order.neighborhood,
        municipality: order.municipality,
        province: order.province,
        items: order.items,
        delivery_token: order.delivery_token,
        driver_id: order.driver_id || null,
        deliverer_name: order.deliverer_name || null,
        seller_name: order.seller_name || null
    };

    const { data, error } = await supabase
        .from('orders')
        .insert([dbOrder])
        .select()
        .single();

    if (error) {
        console.error("Supabase Create Order Error details:", error);
        const enhancedError = new Error(error.message || "Erro desconhecido ao criar pedido");
        (enhancedError as any).details = error.details;
        (enhancedError as any).hint = error.hint;
        (enhancedError as any).code = error.code;
        throw enhancedError;
    }
    return data;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
    // Build a clean DB-compatible update object
    const dbUpdates: any = {};

    if (updates.customer !== undefined) dbUpdates.customer = updates.customer;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.productId !== undefined) dbUpdates.product_id = updates.productId;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.driver_id !== undefined) dbUpdates.driver_id = updates.driver_id;
    if (updates.deliverer_name !== undefined) dbUpdates.deliverer_name = updates.deliverer_name;
    if (updates.seller_name !== undefined) dbUpdates.seller_name = updates.seller_name;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.delivery_token !== undefined) dbUpdates.delivery_token = updates.delivery_token;

    const { error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', id);

    if (error) throw error;
};

// --- Categories ---

export const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching categories:', error);
        throw error;
    }
    return data;
};

export const createCategory = async (category: Omit<Category, 'id' | 'count'>) => {
    const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCategory = async (id: string, updates: Partial<Category>) => {
    const { error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const deleteCategory = async (id: string) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Slides ---

export const fetchSlides = async (): Promise<Slide[]> => {
    const { data, error } = await supabase
        .from('slides')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching slides:', error);
        throw error;
    }
    return data;
};

export const addSlide = async (slide: Omit<Slide, 'id'>) => {
    const { data, error } = await supabase
        .from('slides')
        .insert([slide])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateSlide = async (id: string, updates: Partial<Slide>) => {
    const { error } = await supabase
        .from('slides')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const deleteSlide = async (id: string) => {
    const { error } = await supabase
        .from('slides')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Video Slides ---

export const fetchVideoSlides = async (): Promise<VideoSlide[]> => {
    const { data, error } = await supabase
        .from('video_slides')
        .select('*')
        .order('order_index', { ascending: true });

    if (error) {
        console.error('Error fetching video slides:', error);
        throw error;
    }
    return data;
};

export const addVideoSlide = async (slide: Omit<VideoSlide, 'id'>) => {
    const { data, error } = await supabase
        .from('video_slides')
        .insert([slide])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateVideoSlide = async (id: string, updates: Partial<VideoSlide>) => {
    const { error } = await supabase
        .from('video_slides')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const deleteVideoSlide = async (id: string) => {
    const { error } = await supabase
        .from('video_slides')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Delivery Drivers ---

export const fetchDrivers = async (limit?: number): Promise<DeliveryDriver[]> => {
    let query = supabase
        .from('delivery_drivers')
        .select('*')
        .order('created_at', { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    return data;
};

export const fetchDriverById = async (id: string): Promise<DeliveryDriver | null> => {
    const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching driver:', error);
        throw error;
    }
    return data;
};


// Helper to create auth user (reused from createEmployee logic essentially, but tailored for drivers)
const createAuthUser = async (email: string, password: string, name: string) => {
    // Create a temporary client with service role capabilities if possible, 
    // BUT since we don't have service role key in env (as per previous context), 
    // we use the same "trick" as createEmployee: separate client without session persistence to avoid logging out admin.
    // However, createEmployee uses signUp which only works if email confirmation is off or we don't need immediate login.
    // Assuming 'signUp' is the way to go for this project configuration.

    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: name, role: 'driver' } // Metadata
        }
    });

    if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.status === 422) {
            throw new Error("Este email já está cadastrado. Tente outro.");
        }
        throw signUpError;
    }
    if (!signUpData.user) throw new Error("Falha ao criar usuário de correio.");

    return signUpData.user.id;
};

export const createDriverCredentials = async (driverId: string, email: string, password: string) => {
    // 1. Fetch driver name
    const { data: driver, error: fetchError } = await supabase
        .from('delivery_drivers')
        .select('name')
        .eq('id', driverId)
        .single();

    if (fetchError || !driver) throw new Error("Motorista não encontrado.");

    // 2. Create Auth User
    let userId = null;
    try {
        userId = await createAuthUser(email, password, driver.name);
    } catch (err: any) {
        throw new Error(err.message || "Erro ao criar login.");
    }

    // 3. Update Driver Record
    const { error: updateError } = await supabase
        .from('delivery_drivers')
        .update({ user_id: userId, email: email })
        .eq('id', driverId);

    if (updateError) throw updateError;

    // 4. Create Profile Entry (for consistency)
    const { error: profileError } = await supabase.from('profiles').insert([{
        id: userId,
        email: email,
        full_name: driver.name,
        role: 'driver',
        permissions: {},
        is_active: true
    }]);

    if (profileError) {
        console.error("Warning: Profile creation failed", profileError);
        // Don't throw, primary flow worked
    }
};

export const createDriver = async (driver: Omit<DeliveryDriver, 'id' | 'verified' | 'created_at'> & { password?: string }) => {
    let userId = null;

    // If password provided, create Auth User first
    if (driver.email && driver.password) {
        try {
            userId = await createAuthUser(driver.email, driver.password, driver.name);
        } catch (authError: any) {
            console.error("Auth Error:", authError);
            throw new Error(`Erro ao criar login para motorista: ${authError.message}`);
        }
    }

    // Insert into public table — map all fields from the DriverRegistration form
    const dbDriver: any = {
        name: driver.name,
        email: driver.email || null,
        user_id: userId,
        verified: false, // Pending admin verification for self-registered drivers
        active: (driver as any).active ?? true,
        // Fields from the public registration form
        transport_type: (driver as any).transport_type || driver.vehicle_type || null,
        whatsapp: (driver as any).whatsapp || driver.phone || null,
        address: (driver as any).address || null,
        id_front_url: (driver as any).id_front_url || null,
        id_back_url: (driver as any).id_back_url || null,
        selfie_url: (driver as any).selfie_url || null,
        // Legacy/admin fields (kept for backward compat)
        vehicle_type: driver.vehicle_type || (driver as any).transport_type || null,
        license_plate: driver.license_plate || null,
        phone: driver.phone || (driver as any).whatsapp || null,
        photo_url: driver.photo_url || (driver as any).selfie_url || null,
        ai_verification_result: (driver as any).ai_verification_result || null,
    };

    const { error } = await supabase
        .from('delivery_drivers')
        .insert([dbDriver]);

    if (error) {
        console.error('createDriver DB Insert Error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            dbDriver,
        });
        throw new Error(error.message || 'Erro ao guardar registo do entregador.');
    }

    // Also create a Profile entry so they can log in via standard flow if needed?
    // The requirement is specific to "Driver Portal", so maybe we just rely on the `delivery_drivers` table 
    // OR we standardize on the `profiles` table for ALL users (Employees, Admins, Drivers).
    // Given the `createEmployee` logic, it seems `profiles` table is used for permission checking.
    // Let's also add them to `profiles` with role 'driver' to be safe and consistent.
    if (userId && driver.email) {
        try {
            await supabase.from('profiles').insert([{
                id: userId,
                email: driver.email,
                full_name: driver.name,
                role: 'driver',
                permissions: {}, // Drivers don't have admin panel permissions
                is_active: true
            }]);
        } catch (profileError) {
            console.warn('Profile creation failed for driver (likely RLS), but registration continues:', profileError);
        }
    }

    return null;
};

export const updateDriver = async (id: string, updates: Partial<DeliveryDriver>) => {
    const { error } = await supabase
        .from('delivery_drivers')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
};

export const deleteDriver = async (id: string) => {
    // First, unlink this driver from any orders
    await supabase
        .from('orders')
        .update({ driver_id: null })
        .eq('driver_id', id);

    // Then delete the driver
    const { error } = await supabase
        .from('delivery_drivers')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const assignDriverToOrder = async (orderId: string, driverId: string | null) => {
    const { error } = await supabase
        .from('orders')
        .update({ driver_id: driverId })
        .eq('id', orderId);

    if (error) throw error;
};

// --- Storage / Upload ---

export const uploadImage = async (file: File, bucket: string = 'slides'): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw uploadError;
    }

    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return data.publicUrl;
};

// --- App Settings ---

export const fetchAppSetting = async (key: string): Promise<string | null> => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        console.warn(`Error fetching setting ${key}:`, error);
        return null; // Fallback will be handled by caller
    }
    return data?.value || null;
};

// Batch fetch all app settings for performance
export const fetchAllAppSettings = async (): Promise<Record<string, string>> => {
    const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

    if (error) {
        console.error('Error fetching all settings:', error);
        return {};
    }

    return (data || []).reduce((acc: Record<string, string>, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {});
};

export const updateAppSetting = async (key: string, value: string) => {
    // Try to update first
    const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;
};


