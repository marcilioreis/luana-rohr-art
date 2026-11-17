export interface Collection {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  accent: "blue" | "red";
  sortOrder: number;
  active: boolean;
}

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
  // Segundo eixo (cor/material). Opcional em peças únicas.
  color: string | null;
  sku?: string | null;
  price?: number | null;
  stock: number;
  active: boolean;
}

// Rótulos dos eixos de variação, configuráveis por produto.
// Guardados em products.customStyle (jsonb). Default: "Tamanho" / "Cor".
export interface VariantAxisLabels {
  sizeLabel?: string;
  colorLabel?: string;
}

// Item de listagem (PLP)
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  active: boolean;
  featured?: boolean;
  collectionId?: number | null;
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
  featured?: boolean;
  collectionId?: number | null;
  tags?: string[] | null;
  customStyle?: VariantAxisLabels | null;
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
  featured?: boolean;
  collectionId?: number | null;
  tags?: string[];
  customStyle?: VariantAxisLabels | null;
  variants?: VariantPayload[];
  images?: Array<{ url: string; alt?: string; order?: number }>;
}

export interface VariantPayload {
  size: string;
  color?: string | null;
  sku?: string;
  price?: number | null;
  stock: number;
  active?: boolean;
}
