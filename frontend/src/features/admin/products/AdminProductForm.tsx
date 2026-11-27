import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useUploadImageMutation,
  useDeleteImageMutation,
  useGetCollectionsQuery,
} from "../../products/productsApi";
import type {
  AdminProduct,
  ProductVariant,
  VariantAxisLabels,
  VariantPayload,
} from "../../products/products.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import RelatedProductsEditor from "./RelatedProductsEditor";

interface Props {
  product?: AdminProduct;
}

const emptyVariant = (): VariantPayload => ({
  size: "",
  color: "",
  stock: 0,
  active: true,
});

export default function AdminProductForm({ product }: Props) {
  const navigate = useNavigate();
  const isEditing = Boolean(product);

  const [createProduct, { isLoading: creating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();
  const [createVariant] = useCreateVariantMutation();
  const [uploadImage] = useUploadImageMutation();
  const [deleteImage] = useDeleteImageMutation();

  const { data: collections = [] } = useGetCollectionsQuery();

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ""));
  const [description, setDescription] = useState(product?.description ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [priceOnRequest, setPriceOnRequest] = useState(
    product?.priceOnRequest ?? false,
  );
  const [collectionId, setCollectionId] = useState<number | null>(
    product?.collectionId ?? null,
  );
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  // Rótulos dos eixos de variação (ex.: "Dimensões" / "Material"). Guardados
  // em customStyle. Vazio = usa o padrão "Tamanho" / "Cor" na loja.
  const [sizeLabel, setSizeLabel] = useState(
    product?.customStyle?.sizeLabel ?? "",
  );
  const [colorLabel, setColorLabel] = useState(
    product?.customStyle?.colorLabel ?? "",
  );

  // Criação: variantes e imagens vão no payload
  const [newVariants, setNewVariants] = useState<VariantPayload[]>([
    emptyVariant(),
  ]);
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  // Edição: adicionar variante inline
  const [addVariant, setAddVariant] = useState<VariantPayload>(emptyVariant());

  const parsedTags = tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const buildCustomStyle = (): VariantAxisLabels | null => {
    const cs: VariantAxisLabels = {};
    if (sizeLabel.trim()) cs.sizeLabel = sizeLabel.trim();
    if (colorLabel.trim()) cs.colorLabel = colorLabel.trim();
    return Object.keys(cs).length ? cs : null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(basePrice);
    if (!name.trim() || !(price > 0)) {
      toast.error("Informe nome e preço base válido.");
      return;
    }
    const variants = newVariants
      .filter((v) => v.size.trim())
      .map((v) => ({
        ...v,
        size: v.size.trim(),
        color: v.color?.trim() || null,
      }));
    const images = imageUrls.filter((u) => u.trim()).map((url) => ({ url }));
    try {
      await createProduct({
        name: name.trim(),
        slug: slug.trim() || undefined,
        basePrice: price,
        description: description.trim() || null,
        active,
        featured,
        priceOnRequest,
        collectionId,
        tags: parsedTags,
        customStyle: buildCustomStyle(),
        variants,
        images,
      }).unwrap();
      toast.success("Produto criado.");
      navigate("/admin/produtos");
    } catch {
      toast.error("Erro ao criar produto.");
    }
  };

  const handleSaveFields = async () => {
    if (!product) return;
    const price = Number(basePrice);
    try {
      await updateProduct({
        id: product.id,
        body: {
          name: name.trim(),
          slug: slug.trim() || undefined,
          basePrice: price,
          description: description.trim() || null,
          active,
          featured,
          priceOnRequest,
          collectionId,
          tags: parsedTags,
          customStyle: buildCustomStyle(),
        },
      }).unwrap();
      toast.success("Dados atualizados.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleAddVariant = async () => {
    if (!product) return;
    if (!addVariant.size.trim()) {
      toast.error("Informe o tamanho.");
      return;
    }
    try {
      await createVariant({
        productId: product.id,
        body: {
          ...addVariant,
          size: addVariant.size.trim(),
          color: addVariant.color?.trim() || null,
        },
      }).unwrap();
      setAddVariant(emptyVariant());
      toast.success("Variante adicionada.");
    } catch {
      toast.error("Erro ao adicionar variante.");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      const contentBase64 = result.split(",")[1];
      try {
        await uploadImage({
          productId: product.id,
          fileName: file.name,
          contentBase64,
          mimeType: file.type,
          alt: name,
        }).unwrap();
        toast.success("Imagem enviada.");
      } catch {
        toast.error("Erro ao enviar imagem.");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-20">
      <h1 className="text-2xl font-medium tracking-tight">
        {isEditing ? "Editar produto" : "Novo produto"}
      </h1>

      <form
        onSubmit={handleCreate}
        className="space-y-5 rounded-xl border bg-card p-6"
      >
        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="prod-name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-slug">URL (slug)</Label>
          <Input
            id="prod-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            data-testid="prod-slug"
            placeholder="gerado a partir do nome se vazio"
          />
          <p className="text-xs text-muted-foreground">
            Endereço da página: <code>/produto/{slug || "…"}</code>. Deixe em
            branco para gerar do nome. Alterar muda o link do produto.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preço base (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              data-testid="prod-price"
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <Switch
              checked={active}
              onCheckedChange={setActive}
              id="prod-active"
            />
            <Label htmlFor="prod-active">Ativo</Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prod-collection">Coleção</Label>
          <select
            id="prod-collection"
            value={collectionId ?? ""}
            onChange={(e) =>
              setCollectionId(e.target.value ? Number(e.target.value) : null)
            }
            data-testid="prod-collection"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">— Sem coleção —</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <Switch
            checked={featured}
            onCheckedChange={setFeatured}
            id="prod-featured"
            data-testid="prod-featured"
          />
          <Label htmlFor="prod-featured" className="cursor-pointer">
            Destaque na Home
            <span className="ml-1 font-normal text-muted-foreground">
              — aparece no hero da página inicial
            </span>
          </Label>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
          <Switch
            checked={priceOnRequest}
            onCheckedChange={setPriceOnRequest}
            id="prod-price-on-request"
            data-testid="prod-price-on-request"
          />
          <Label htmlFor="prod-price-on-request" className="cursor-pointer">
            Preço sob consulta
            <span className="ml-1 font-normal text-muted-foreground">
              — esconde preço e carrinho; mostra botão do WhatsApp da artista
            </span>
          </Label>
        </div>
        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Tags (separadas por vírgula)</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="aquarela, botânica"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="prod-size-label">Rótulo do 1º eixo</Label>
            <Input
              id="prod-size-label"
              value={sizeLabel}
              onChange={(e) => setSizeLabel(e.target.value)}
              placeholder="Tamanho"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prod-color-label">Rótulo do 2º eixo</Label>
            <Input
              id="prod-color-label"
              value={colorLabel}
              onChange={(e) => setColorLabel(e.target.value)}
              placeholder="Cor"
            />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            Como os eixos de variação aparecem na loja. Ex.: para quadros use{" "}
            <code>Dimensões</code> e <code>Material</code>. Em branco = padrão
            (Tamanho / Cor). Deixe o 2º eixo das variantes vazio para peças sem
            cor/material.
          </p>
        </div>

        {!isEditing && (
          <>
            {/* Variantes na criação */}
            <div className="space-y-2">
              <Label>Variantes (tamanho / cor opcional / estoque)</Label>
              {newVariants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Tam."
                    value={v.size}
                    onChange={(e) =>
                      setNewVariants((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, size: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    placeholder="Cor/Material (opcional)"
                    value={v.color ?? ""}
                    onChange={(e) =>
                      setNewVariants((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, color: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Estoque"
                    value={v.stock}
                    onChange={(e) =>
                      setNewVariants((arr) =>
                        arr.map((x, j) =>
                          j === i ? { ...x, stock: Number(e.target.value) } : x,
                        ),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setNewVariants((arr) => arr.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewVariants((a) => [...a, emptyVariant()])}
              >
                <Plus className="mr-1 h-4 w-4" /> Variante
              </Button>
            </div>

            {/* Imagens por URL na criação */}
            <div className="space-y-2">
              <Label>Imagens (URL)</Label>
              {imageUrls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={u}
                    onChange={(e) =>
                      setImageUrls((arr) =>
                        arr.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setImageUrls((arr) => arr.filter((_, j) => j !== i))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageUrls((a) => [...a, ""])}
              >
                <Plus className="mr-1 h-4 w-4" /> Imagem
              </Button>
            </div>
          </>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/produtos")}
          >
            Cancelar
          </Button>
          {isEditing ? (
            <Button
              type="button"
              onClick={handleSaveFields}
              disabled={updating}
            >
              {updating ? "Salvando..." : "Salvar dados"}
            </Button>
          ) : (
            <Button type="submit" disabled={creating} data-testid="prod-submit">
              {creating ? "Criando..." : "Criar produto"}
            </Button>
          )}
        </div>
      </form>

      {/* Edição: variantes e imagens existentes */}
      {isEditing && product && (
        <>
          <div className="space-y-3 rounded-xl border bg-card p-6">
            <h2 className="font-semibold">Variantes</h2>
            <p className="text-xs text-muted-foreground">
              Edite cada variante e clique em Salvar. Deixe a cor/material em
              branco para peças sem esse eixo (ex.: remover um antigo “N/A”).
            </p>
            {product.variants.map((v) => (
              <VariantEditRow key={v.id} variant={v} productId={product.id} />
            ))}
            <div className="flex gap-2 border-t pt-3">
              <Input
                placeholder="Tam."
                value={addVariant.size}
                onChange={(e) =>
                  setAddVariant((v) => ({ ...v, size: e.target.value }))
                }
              />
              <Input
                placeholder="Cor/Material (opcional)"
                value={addVariant.color ?? ""}
                onChange={(e) =>
                  setAddVariant((v) => ({ ...v, color: e.target.value }))
                }
              />
              <Input
                type="number"
                placeholder="Estoque"
                value={addVariant.stock}
                onChange={(e) =>
                  setAddVariant((v) => ({
                    ...v,
                    stock: Number(e.target.value),
                  }))
                }
              />
              <Button type="button" onClick={handleAddVariant}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-6">
            <h2 className="font-semibold">Imagens</h2>
            <div className="flex flex-wrap gap-3">
              {product.images.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.url}
                    alt={img.alt ?? ""}
                    className="h-24 w-20 rounded object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-2 -top-2 h-6 w-6"
                    onClick={() =>
                      deleteImage({ imageId: img.id, productId: product.id })
                        .unwrap()
                        .then(() => toast.success("Imagem removida."))
                        .catch(() => toast.error("Erro ao remover."))
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <Input type="file" accept="image/*" onChange={handleUpload} />
          </div>

          <div className="space-y-3 rounded-xl border bg-card p-6">
            <h2 className="font-semibold">Produtos relacionados</h2>
            <RelatedProductsEditor productId={product.id} />
          </div>
        </>
      )}
    </div>
  );
}

// Linha de variante editável (edição inline): permite ajustar tamanho, cor/
// material (opcional — em branco vira null), estoque e preço, ou remover.
function VariantEditRow({
  variant,
  productId,
}: {
  variant: ProductVariant;
  productId: number;
}) {
  const [updateVariant, { isLoading: saving }] = useUpdateVariantMutation();
  const [deleteVariant, { isLoading: deleting }] = useDeleteVariantMutation();

  const [size, setSize] = useState(variant.size);
  const [color, setColor] = useState(variant.color ?? "");
  const [stock, setStock] = useState(String(variant.stock));
  const [price, setPrice] = useState(
    variant.price != null ? String(variant.price) : "",
  );

  const handleSave = async () => {
    if (!size.trim()) {
      toast.error("Informe o tamanho.");
      return;
    }
    const priceNum = price.trim() ? Number(price) : null;
    if (priceNum != null && !(priceNum > 0)) {
      toast.error("Preço inválido.");
      return;
    }
    try {
      await updateVariant({
        variantId: variant.id,
        productId,
        body: {
          size: size.trim(),
          color: color.trim() || null,
          stock: Number(stock) || 0,
          price: priceNum,
        },
      }).unwrap();
      toast.success("Variante atualizada.");
    } catch {
      toast.error("Erro ao salvar variante.");
    }
  };

  const handleDelete = () => {
    deleteVariant({ variantId: variant.id, productId })
      .unwrap()
      .then(() => toast.success("Variante removida."))
      .catch(() => toast.error("Erro ao remover."));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b pb-2">
      <Input
        className="w-24"
        placeholder="Tam."
        value={size}
        onChange={(e) => setSize(e.target.value)}
      />
      <Input
        className="w-40"
        placeholder="Cor/Material (opcional)"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <Input
        className="w-20"
        type="number"
        placeholder="Estoque"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
      />
      <Input
        className="w-24"
        type="number"
        step="0.01"
        placeholder="Preço (opc.)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "..." : "Salvar"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={deleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
