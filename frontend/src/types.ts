export interface Category {
  id: number;
  name: string;
  slug: string;
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
  image: string | null;
  min_price: string | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  category: Category;
  description: string;
  image: string | null;
  variants: ProductVariant[];
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
  total_amount: string;
  shipping_address: string;
  items: OrderItem[];
  payment: Payment | null;
  created_at: string;
}
