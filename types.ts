
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
  created_by_name?: string;
  createdAt?: string;
  salePrice?: number;
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
  phone?: string; // Contact for WhatsApp
  amount: number;
  status: 'PAGO' | 'ENVIADO' | 'PENDENTE';
  date: string;
  address?: string;
  neighborhood?: string;
  municipality?: string;
  province?: string;
  seller_name?: string;
  validator_name?: string;
  deliverer_name?: string;
}

export interface InventoryAlert {
  name: string;
  units: number;
  status: 'CRÍTICO' | 'BAIXO';
}

export interface UserPermissions {
  orders?: boolean;
  products?: boolean;
  finance?: boolean;
  settings?: boolean;
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
