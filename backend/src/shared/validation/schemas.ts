// src/shared/validation/schemas.ts
import { z } from 'zod';
import { ORDER_STATUSES } from '../db/schema/orders.js';

// ================== PRODUTOS ==================
export const variantSchema = z.object({
  size: z.string().min(1, 'Tamanho é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
  sku: z.string().optional(),
  price: z.number().gt(0).optional().nullable(),
  stock: z.number().int().min(0, 'Estoque não pode ser negativo').default(0),
  active: z.boolean().optional().default(true),
});

export const imageSchema = z.object({
  url: z.string().min(1, 'URL da imagem é obrigatória'),
  key: z.string().optional(),
  alt: z.string().optional(),
  order: z.number().int().optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  basePrice: z.number().gt(0, 'Preço deve ser maior que zero'),
  active: z.boolean().optional().default(true),
  collectionId: z.number().int().positive().nullable().optional(),
  customStyle: z.unknown().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
});

export const updateProductSchema = z
  .object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    basePrice: z.number().gt(0).optional(),
    active: z.boolean().optional(),
    collectionId: z.number().int().positive().nullable().optional(),
    customStyle: z.unknown().optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

export const createVariantSchema = variantSchema;
export const updateVariantSchema = z
  .object({
    size: z.string().min(1).optional(),
    color: z.string().min(1).optional(),
    sku: z.string().optional(),
    price: z.number().gt(0).optional().nullable(),
    stock: z.number().int().min(0, 'Estoque não pode ser negativo').optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

// ================== CHECKOUT / PEDIDOS ==================
export const addressSchema = z.object({
  cep: z.string().min(8).max(10),
  street: z.string().min(1, 'Logradouro é obrigatório'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  district: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF deve ter 2 letras'),
});

export const checkoutItemSchema = z.object({
  variantId: z.number().int().positive('Variante inválida'),
  quantity: z.number().int().positive('Quantidade deve ser positiva'),
});

export const createOrderSchema = z
  .object({
    items: z.array(checkoutItemSchema).nonempty('O carrinho não pode estar vazio'),
    customer: z.object({
      name: z.string().min(1, 'Nome é obrigatório'),
      email: z.email('E-mail inválido'),
      phone: z.string().optional(),
    }),
    // Modalidade de entrega: entrega exige endereço; retirada dispensa (sem custo).
    deliveryMethod: z.enum(['entrega', 'retirada']).optional().default('entrega'),
    shippingAddress: addressSchema.optional(),
    shippingFee: z.number().min(0).optional().default(0),
    notes: z.string().optional(),
  })
  .refine((data) => data.deliveryMethod === 'retirada' || data.shippingAddress != null, {
    message: 'Endereço de entrega é obrigatório',
    path: ['shippingAddress'],
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

// ================== EXPORTS ==================
export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'json', 'pdf']).optional().default('csv'),
  filters: z
    .object({
      status: z.enum(ORDER_STATUSES).optional(),
      startDate: z.iso.datetime({ message: 'Data de início inválida' }).optional(),
      endDate: z.iso.datetime({ message: 'Data de término inválida' }).optional(),
    })
    .optional(),
});

// ================== ADMIN ==================
export const createUserAdminSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório'),
  roleIds: z.array(z.number().int().positive()).optional(),
});

export const updateUserAdminSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  role: z.string().optional(),
  roleIds: z.array(z.number().int().positive()).optional(),
  active: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, 'Nome da role é obrigatório'),
  description: z.string().optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.number().int().positive()).optional(),
});
