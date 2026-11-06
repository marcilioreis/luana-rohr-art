// src/modules/products/products.controller.ts
import { Request, Response } from 'express';
import * as productService from './products.service.js';
import { storage } from '../../shared/storage/storage.js';
import { db } from '../../shared/db/index.js';
import { auditLogs } from '../../shared/db/schema/audit.js';

const getNumericId = (param: string | string[]): number => {
  const id = Array.isArray(param) ? param[0] : param;
  return parseInt(id, 10);
};

// ========== PÚBLICO ==========
export const listCollections = async (_req: Request, res: Response) => {
  try {
    const items = await productService.listCollections();
    res.json(items);
  } catch (error) {
    console.error('List collections error:', error);
    res.status(500).json({ error: 'Falha ao listar coleções' });
  }
};

export const getFeaturedProduct = async (_req: Request, res: Response) => {
  try {
    const product = await productService.getFeaturedPublic();
    res.json(product); // pode ser null (nenhum destaque definido)
  } catch (error) {
    console.error('Get featured product error:', error);
    res.status(500).json({ error: 'Falha ao obter produto em destaque' });
  }
};

export const listProducts = async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const collection = typeof req.query.collection === 'string' ? req.query.collection : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : undefined;
    const items = await productService.listPublic({ search, collection, limit, offset });
    res.json(items);
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Falha ao listar produtos' });
  }
};

export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
    const product = await productService.getBySlugPublic(slug);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Falha ao obter produto' });
  }
};

// ========== ADMIN ==========
export const listProductsAdmin = async (_req: Request, res: Response) => {
  try {
    const items = await productService.listAdmin();
    res.json(items);
  } catch (error) {
    console.error('List products (admin) error:', error);
    res.status(500).json({ error: 'Falha ao listar produtos' });
  }
};

export const getProductAdmin = async (req: Request, res: Response) => {
  try {
    const product = await productService.getByIdAdmin(getNumericId(req.params.id));
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (error) {
    console.error('Get product (admin) error:', error);
    res.status(500).json({ error: 'Falha ao obter produto' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { variants, images, ...productData } = req.body;
    const product = await productService.create(
      productData,
      req.user!.id,
      variants ?? [],
      images ?? []
    );
    const full = await productService.getByIdAdmin(product.id);
    res.status(201).json(full);

    await db.insert(auditLogs).values({
      userId: req.user!.id,
      action: 'product.create',
      entityType: 'product',
      entityId: product.id,
      details: { name: product.name },
      ip: req.ip,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Falha ao criar produto' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = getNumericId(req.params.id);
    const product = await productService.update(id, req.body);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    const full = await productService.getByIdAdmin(id);
    res.json(full);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Falha ao atualizar produto' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deleted = await productService.remove(getNumericId(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Produto não encontrado' });
    res.status(204).send();
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Falha ao excluir produto' });
  }
};

// ========== VARIANTES ==========
export const createVariant = async (req: Request, res: Response) => {
  try {
    const productId = getNumericId(req.params.id);
    const variant = await productService.addVariant(productId, req.body);
    res.status(201).json(variant);
  } catch (error) {
    console.error('Create variant error:', error);
    res.status(500).json({ error: 'Falha ao criar variante' });
  }
};

export const updateVariant = async (req: Request, res: Response) => {
  try {
    const variantId = getNumericId(req.params.variantId);
    const variant = await productService.updateVariant(variantId, req.body);
    if (!variant) return res.status(404).json({ error: 'Variante não encontrada' });
    res.json(variant);
  } catch (error) {
    console.error('Update variant error:', error);
    res.status(500).json({ error: 'Falha ao atualizar variante' });
  }
};

export const deleteVariant = async (req: Request, res: Response) => {
  try {
    const deleted = await productService.deleteVariant(getNumericId(req.params.variantId));
    if (!deleted) return res.status(404).json({ error: 'Variante não encontrada' });
    res.status(204).send();
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Falha ao excluir variante' });
  }
};

// ========== IMAGENS (upload via StorageProvider) ==========
export const uploadImage = async (req: Request, res: Response) => {
  try {
    const productId = getNumericId(req.params.id);
    const { fileName, contentBase64, mimeType, alt, order } = req.body as {
      fileName?: string;
      contentBase64?: string;
      mimeType?: string;
      alt?: string;
      order?: number;
    };
    if (!fileName || !contentBase64 || !mimeType) {
      return res.status(400).json({ error: 'fileName, contentBase64 e mimeType são obrigatórios' });
    }
    const safeName = `products/${productId}/${Date.now()}_${fileName}`;
    const buffer = Buffer.from(contentBase64, 'base64');
    const url = await storage.save(safeName, buffer, mimeType);
    const image = await productService.addImage(productId, {
      url,
      key: safeName,
      alt,
      order,
    });
    res.status(201).json(image);
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Falha ao enviar imagem' });
  }
};

export const deleteImage = async (req: Request, res: Response) => {
  try {
    const deleted = await productService.deleteImage(getNumericId(req.params.imageId));
    if (!deleted) return res.status(404).json({ error: 'Imagem não encontrada' });
    if (deleted.key) {
      try {
        await storage.delete(deleted.key);
      } catch (e) {
        console.warn('Falha ao remover imagem do storage:', e);
      }
    }
    res.status(204).send();
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Falha ao excluir imagem' });
  }
};
