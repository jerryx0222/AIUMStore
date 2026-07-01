export type PersonLevel =
  | "superuser"
  | "brand_owner"
  | "franchise_master"
  | "store_owner"
  | "store_clerk"
  | "member";

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

export type BrandType = "product_brand" | "franchise_brand";

export interface Brand {
  id: number;
  brand_type: BrandType;
  name_en: string;
  name_zh: string;
  icon: string | null;
  contact: number | null;
  website: string;
  note: string;
  owner: number | null;
  carried_product_brands: number[];
}

export interface ProductImage {
  id: number;
  image: string;
  sort_order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  category: Category;
  product_brand_name: string | null;
  spec: string;
  process: string;
  suggested_price: string;
  selling_price: string;
  images: ProductImage[];
}

export interface StoreProductListing {
  id: number;
  franchise_brand: number;
  franchise_brand_name: string;
  product: Product;
  stock: number;
  actual_price: string | null;
  price: string;
  is_active: boolean;
}

export interface ManagedStoreProductListing {
  id: number;
  franchise_brand: number;
  product: number;
  stock: number;
  actual_price: string | null;
  is_active: boolean;
}

export interface FranchiseListing {
  id: number;
  franchise_brand: number;
  franchise_brand_name: string;
  product: number;
  product_name: string;
  stock: number;
  actual_price: string | null;
  is_active: boolean;
}

export interface ManagedProduct {
  id: number;
  category: number;
  name: string;
  slug: string;
  spec: string;
  process: string;
  suggested_price: string;
  selling_price: string;
  images: ProductImage[];
}

export interface StoreDashboard {
  revenue: string | number;
  order_count: number;
  top_products: { product_name: string; quantity_sold: number }[];
}

export interface PersonBrief {
  id: number;
  username: string;
  name: string;
  level: PersonLevel;
  mobile: string;
  phone: string;
  email: string;
}

export interface StoreClerkGroup {
  store_owner: PersonBrief;
  store_name: string | null;
  clerks: PersonBrief[];
}

export interface FranchiseMasterGroup {
  franchise_master: PersonBrief;
  franchised_brands: (Brand & { products: Product[] })[];
  managed_store_owners: PersonBrief[];
}

export interface BrandOwnerGroup {
  brand_owner: PersonBrief;
  brand: Brand | null;
  products: Product[];
}

export interface ManagementDashboard {
  store_clerks: StoreClerkGroup[];
  franchise_masters: FranchiseMasterGroup[];
  brand_owners: BrandOwnerGroup[];
}

export interface CartItem {
  id: number;
  listing: StoreProductListing;
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
  store_name: string;
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
  discount_amount: string;
  shipping_address: string;
  items: OrderItem[];
  payment: Payment | null;
  created_at: string;
}
