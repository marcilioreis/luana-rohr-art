import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useCreateVariantMutation,
  useDeleteVariantMutation,
  useUploadImageMutation,
  useDeleteImageMutation,
} from "../../products/productsApi";
import type {
  AdminProduct,
  VariantPayload,
} from "../../products/products.types";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";

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
  const [deleteVariant] = useDeleteVariantMutation();
  const [uploadImage] = useUploadImageMutation();
  const [deleteImage] = useDeleteImageMutation();

  const [name, setName] = useState(product?.name ?? "");
  const [basePrice, setBasePrice] = useState(String(product?.basePrice ?? ""));
  const [description, setDescription] = useState(product?.description ?? "");
  const [active, setActive] = useState(product?.active ?? true);
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(basePrice);
    if (!name.trim() || !(price > 0)) {
      toast.error("Informe nome e preço base válido.");
      return;
    }
    const variants = newVariants.filter((v) => v.size.trim() && v.color.trim());
    const images = imageUrls.filter((u) => u.trim()).map((url) => ({ url }));
    try {
      await createProduct({
        name: name.trim(),
        basePrice: price,
        description: description.trim() || null,
        active,
        tags: parsedTags,
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
          basePrice: price,
          description: description.trim() || null,
          active,
          tags: parsedTags,
        },
      }).unwrap();
      toast.success("Dados atualizados.");
    } catch {
      toast.error("Erro ao atualizar.");
    }
  };

  const handleAddVariant = async () => {
    if (!product) return;
    if (!addVariant.size.trim() || !addVariant.color.trim()) {
      toast.error("Informe tamanho e cor.");
      return;
    }
    try {
      await createVariant({ productId: product.id, body: addVariant }).unwrap();
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

        {!isEditing && (
          <>
            {/* Variantes na criação */}
            <div className="space-y-2">
              <Label>Variantes (tamanho / cor / estoque)</Label>
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
                    placeholder="Cor"
                    value={v.color}
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
            {product.variants.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {v.size} / {v.color} — estoque {v.stock}
                  {v.price ? ` — ${formatBRL(v.price)}` : ""}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    deleteVariant({ variantId: v.id, productId: product.id })
                      .unwrap()
                      .then(() => toast.success("Variante removida."))
                      .catch(() => toast.error("Erro ao remover."))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
                placeholder="Cor"
                value={addVariant.color}
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
        </>
      )}
    </div>
  );
}
