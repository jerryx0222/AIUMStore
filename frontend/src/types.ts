export type UserRole = "superuser" | "firm" | "member";

export interface Category {
  id: number;
  name: string;
  slug: string;
  sub_category_1: string;
  sub_category_2: string;
  sub_category_3: string;
  sub_category_4: string;
  sub_category_5: string;
  sub_categories: string[];
  description: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  price: string;
  stock: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  category: Category;
  brand_name: string | null;
  image: string | null;
  min_price: string | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  category: Category;
  brand_name: string | null;
  description: string;
  image: string | null;
  variants: ProductVariant[];
}

export interface ManagedProduct {
  id: number;
  category: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  is_active: boolean;
  variants: ProductVariant[];
}

export interface Firm {
  id: number;
  name: string;
  branch_name: string;
  address: string;
  phone: string;
  brand: number | null;
  description: string;
}

export interface BrandOption {
  id: number;
  name: string;
  logo: string | null;
  founding_firm: number | null;
  founder: number | null;
}

export interface FirmDashboard {
  revenue: string | number;
  order_count: number;
  top_products: { product_name: string; quantity_sold: number }[];
}

export interface CartItem {
  id: number;
  variant: ProductVariant;
  quantity: number;
  subtotal: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  variant_name: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface Payment {
  id: number;
  method: string;
  status: string;
  transaction_id: string;
  paid_at: string | null;
}

export interface Order {
  id: number;
  status: string;
  fulfillment_type: "delivery" | "pickup";
  guest_name: string;
  guest_phone: string;
  total_amount: string;
  discount_amount: string;
  shipping_address: string;
  items: OrderItem[];
  payment: Payment | null;
  created_at: string;
}
