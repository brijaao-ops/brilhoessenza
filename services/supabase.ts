import { createClient } from '@supabase/supabase-js';
import { Product, Order, Category, Slide, UserProfile, UserPermissions, DeliveryDriver } from '../types';

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

export const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    // Map snake_case database fields to camelCase application interface if needed.
    // Assuming 1:1 mapping for now based on the migration, except specific fields.
    return data.map((p: any) => ({
        ...p,
        costPrice: p.cost_price,
        reviewsCount: p.reviews_count,
        subCategory: p.sub_category,
        bestSeller: p.best_seller,
        createdAt: p.created_at,
        salePrice: p.sale_price
    }));
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
        created_by_name: product.created_by_name,
        gender: product.gender,
        notes: product.notes,
        sale_price: product.salePrice
    };

    const { data, error } = await supabase
        .from('products')
        .insert([dbProduct])
        .select()
        .single();

    if (error) throw error;
    return data;
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
    if (product.created_by_name !== undefined) dbProduct.created_by_name = product.created_by_name;
    if (product.notes !== undefined) dbProduct.notes = product.notes;
    if (product.gender !== undefined) dbProduct.gender = product.gender;

    const { error } = await supabase
        .from('products')
        .update(dbProduct)
        .eq('id', id);

    if (error) throw error;
};

export const deleteProduct = async (id: string) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// --- Orders ---

export const fetchOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*, driver:delivery_drivers(*)')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return data;
};

export const createOrder = async (order: Order) => {
    const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
    const { error } = await supabase
        .from('orders')
        .update(updates)
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
        return [];
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
        return [];
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

// --- Delivery Drivers ---

export const fetchDrivers = async (): Promise<DeliveryDriver[]> => {
    const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .order('created_at', { ascending: false });

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

export const createDriver = async (driver: Omit<DeliveryDriver, 'id' | 'verified' | 'created_at'>) => {
    const { error } = await supabase
        .from('delivery_drivers')
        .insert([driver]);

    if (error) throw error;
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

export const updateAppSetting = async (key: string, value: string) => {
    // Try to update first
    const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });

    if (error) throw error;
};


