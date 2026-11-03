import { api } from "../../lib/api";
import type {
  Product,
  ProductListItem,
  AdminProduct,
  ProductPayload,
  ProductVariant,
  VariantPayload,
  ProductImage,
  Collection,
} from "./products.types";

export const productsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ---- Público ----
    getCollections: builder.query<Collection[], void>({
      query: () => "/products/collections",
    }),
    getProducts: builder.query<
      ProductListItem[],
      { search?: string; collection?: string } | void
    >({
      query: (args) => {
        const params = new URLSearchParams();
        if (args && "search" in args && args.search)
          params.set("search", args.search);
        if (args && "collection" in args && args.collection)
          params.set("collection", args.collection);
        const qs = params.toString();
        return qs ? `/products?${qs}` : "/products";
      },
      providesTags: ["Product"],
    }),
    getProductBySlug: builder.query<Product, string>({
      query: (slug) => `/products/${slug}`,
      providesTags: (_r, _e, slug) => [{ type: "Product", id: slug }],
    }),

    // ---- Admin ----
    getAdminProducts: builder.query<AdminProduct[], void>({
      query: () => "/products/manage",
      providesTags: ["AdminProduct"],
    }),
    getAdminProduct: builder.query<AdminProduct, number>({
      query: (id) => `/products/manage/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AdminProduct", id }],
    }),
    createProduct: builder.mutation<AdminProduct, ProductPayload>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["AdminProduct", "Product"],
    }),
    updateProduct: builder.mutation<
      AdminProduct,
      { id: number; body: Partial<ProductPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "AdminProduct", id },
        "AdminProduct",
        "Product",
      ],
    }),
    deleteProduct: builder.mutation<void, number>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminProduct", "Product"],
    }),

    // Variantes
    createVariant: builder.mutation<
      ProductVariant,
      { productId: number; body: VariantPayload }
    >({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/variants`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { productId }) => [
        { type: "AdminProduct", id: productId },
      ],
    }),
    updateVariant: builder.mutation<
      ProductVariant,
      { variantId: number; productId: number; body: Partial<VariantPayload> }
    >({
      query: ({ variantId, body }) => ({
        url: `/products/variants/${variantId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_r, _e, { productId }) => [
        { type: "AdminProduct", id: productId },
      ],
    }),
    deleteVariant: builder.mutation<
      void,
      { variantId: number; productId: number }
    >({
      query: ({ variantId }) => ({
        url: `/products/variants/${variantId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { productId }) => [
        { type: "AdminProduct", id: productId },
      ],
    }),

    // Imagens (upload base64 → StorageProvider)
    uploadImage: builder.mutation<
      ProductImage,
      {
        productId: number;
        fileName: string;
        contentBase64: string;
        mimeType: string;
        alt?: string;
        order?: number;
      }
    >({
      query: ({ productId, ...body }) => ({
        url: `/products/${productId}/images`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { productId }) => [
        { type: "AdminProduct", id: productId },
      ],
    }),
    deleteImage: builder.mutation<void, { imageId: number; productId: number }>(
      {
        query: ({ imageId }) => ({
          url: `/products/images/${imageId}`,
          method: "DELETE",
        }),
        invalidatesTags: (_r, _e, { productId }) => [
          { type: "AdminProduct", id: productId },
        ],
      },
    ),
  }),
});

export const {
  useGetCollectionsQuery,
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useGetAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useUploadImageMutation,
  useDeleteImageMutation,
} = productsApi;
