
export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  rating: number;
  reviewsCount: number;
  category: string; // Changed from literal type to string to support dynamic categories
  subCategory?: string;
  image: string;
  description: string;
  stock: number;
  bestSeller?: boolean;
  gender: 'masculino' | 'feminino' | 'unissexo';
  createdAt?: string;
  created_at?: string; // DB Alias
  salePrice?: number;
  sale_price?: number; // DB Alias
  deliveryCommission?: number; // % do preço que o entregador ganha
  delivery_commission?: number; // DB Alias
  createdByName?: string;
  created_by_name?: string; // DB Alias
  lastEditedBy?: string;
  last_edited_by?: string; // DB Alias
  notes?: {
    top: string;
    heart: string;
    base: string;
  };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  icon: string;
  color: string;
  active: boolean;
}

export interface Order {
  id: string;
  customer: string;
  customer_name?: string; // DB Alias
  phone?: string; // Contact for WhatsApp
  amount: number;
  total?: number; // DB Alias
  status: 'PAGO' | 'ENVIADO' | 'PENDENTE' | 'PEDIDO' | 'DELIVERED' | 'CANCELLED';
  date: string;
  time?: string;
  address?: string;
  neighborhood?: string;
  municipality?: string;
  province?: string;
  seller_name?: string;
  validator_name?: string;
  deliverer_name?: string;
  productId?: string;
  product_id?: string; // DB Alias
  driver_id?: string;
  driver?: DeliveryDriver;
  delivery_token?: string;
  delivery_confirmation_time?: string;
  items?: any[]; // Stores the cart items snapshot
}

export interface DeliveryDriver {
  id: string;
  name: string;
  address: string;
  transport_type: string;
  whatsapp: string;
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  photo_url?: string;
  vehicle_type?: string;
  license_plate?: string;
  verified: boolean;
  active: boolean;
  created_at: string;
  ai_verification_result?: string; // JSON string of the AI analysis
  email?: string;
  user_id?: string;
  phone?: string; // Standardize phone/whatsapp access
}

export interface InventoryAlert {
  name: string;
  units: number;
  status: 'CRÍTICO' | 'BAIXO';
}

export interface UserPermissions {
  orders?: Record<string, boolean>;
  products?: Record<string, boolean>;
  finance?: Record<string, boolean>;
  settings?: Record<string, boolean>;
  team?: Record<string, boolean>;
  sales?: Record<string, boolean>;
  drivers?: Record<string, boolean>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'employee';
  permissions: UserPermissions;
  is_first_login: boolean;
  is_active?: boolean;
}

export interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  button_text: string;
  button_link: string;
  order_index: number;
}
export interface VideoSlide {
  id: string;
  title?: string;
  video_url: string;
  active: boolean;
  order_index: number;
  created_at?: string;
}
