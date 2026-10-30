export interface ProductImage {
  id: number;
  url: string;
  key?: string | null;
  alt?: string | null;
  order?: number | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  size: string;
  color: string;
  sku?: string | null;
  price?: number | null;
  stock: number;
  active: boolean;
}

// Item de listagem (PLP)
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  active: boolean;
  tags?: string[] | null;
  image: ProductImage | null;
}

// Produto completo (PDP)
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  active: boolean;
  tags?: string[] | null;
  createdAt?: string;
  variants: ProductVariant[];
  images: ProductImage[];
}

// Produto no painel admin (com contagens)
export interface AdminProduct extends Product {
  variantCount: number;
  totalStock: number;
}

export interface ProductPayload {
  name: string;
  slug?: string;
  description?: string | null;
  basePrice: number;
  active?: boolean;
  tags?: string[];
  variants?: VariantPayload[];
  images?: Array<{ url: string; alt?: string; order?: number }>;
}

export interface VariantPayload {
  size: string;
  color: string;
  sku?: string;
  price?: number | null;
  stock: number;
  active?: boolean;
}
