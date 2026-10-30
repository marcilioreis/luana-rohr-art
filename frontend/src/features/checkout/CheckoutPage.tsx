import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectCartItems,
  selectCartSubtotal,
  clearCart,
} from "../cart/cartSlice";
import { useCreateOrderMutation } from "../account/ordersApi";
import type { Order } from "../account/orders.types";
import { formatBRL } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PixPayment from "./PixPayment";

const SHIPPING_FEE = 20;

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isLoadingAuth = useAppSelector((s) => s.auth.isLoading);

  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    notes: "",
  });

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // Aguarda resolução da sessão antes de decidir redirecionar
  if (isLoadingAuth) {
    return (
      <div className="p-8 text-center text-muted-foreground">Carregando...</div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: "/checkout" }} />;
  }

  // Pagamento gerado → mostra PIX
  if (createdOrder) {
    return <PixPayment order={createdOrder} />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">Seu carrinho está vazio.</p>
        <Button asChild className="mt-4">
          <Link to="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  const total = subtotal + SHIPPING_FEE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: Array<keyof typeof form> = [
      "name",
      "email",
      "cep",
      "street",
      "number",
      "district",
      "city",
      "state",
    ];
    for (const r of required) {
      if (!form[r].trim()) {
        toast.error("Preencha todos os campos obrigatórios.");
        return;
      }
    }
    if (form.state.trim().length !== 2) {
      toast.error("UF deve ter 2 letras (ex.: SP).");
      return;
    }

    try {
      const order = await createOrder({
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        customer: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
        },
        shippingAddress: {
          cep: form.cep.trim(),
          street: form.street.trim(),
          number: form.number.trim(),
          complement: form.complement.trim() || undefined,
          district: form.district.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
        },
        shippingFee: SHIPPING_FEE,
        notes: form.notes.trim() || undefined,
      }).unwrap();
      dispatch(clearCart());
      setCreatedOrder(order);
    } catch (err) {
      const e = err as { data?: { error?: string } };
      toast.error(e?.data?.error ?? "Erro ao criar pedido.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        Finalizar compra
      </h1>
      <form
        onSubmit={handleSubmit}
        className="grid gap-8 md:grid-cols-[1fr_320px]"
      >
        {/* Dados */}
        <div className="space-y-6">
          <fieldset className="space-y-4 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold">Seus dados</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome *">
                <Input
                  value={form.name}
                  onChange={set("name")}
                  data-testid="co-name"
                />
              </Field>
              <Field label="E-mail *">
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  data-testid="co-email"
                />
              </Field>
              <Field label="Telefone">
                <Input
                  value={form.phone}
                  onChange={set("phone")}
                  data-testid="co-phone"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold">
              Endereço de entrega
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP *">
                <Input
                  value={form.cep}
                  onChange={set("cep")}
                  data-testid="co-cep"
                />
              </Field>
              <Field label="Rua / Logradouro *">
                <Input
                  value={form.street}
                  onChange={set("street")}
                  data-testid="co-street"
                />
              </Field>
              <Field label="Número *">
                <Input
                  value={form.number}
                  onChange={set("number")}
                  data-testid="co-number"
                />
              </Field>
              <Field label="Complemento">
                <Input value={form.complement} onChange={set("complement")} />
              </Field>
              <Field label="Bairro *">
                <Input
                  value={form.district}
                  onChange={set("district")}
                  data-testid="co-district"
                />
              </Field>
              <Field label="Cidade *">
                <Input
                  value={form.city}
                  onChange={set("city")}
                  data-testid="co-city"
                />
              </Field>
              <Field label="UF *">
                <Input
                  maxLength={2}
                  value={form.state}
                  onChange={set("state")}
                  data-testid="co-state"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold">Observações</legend>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={set("notes")}
              placeholder="Opcional"
            />
          </fieldset>
        </div>

        {/* Resumo */}
        <aside className="h-fit rounded-xl border p-5">
          <h2 className="mb-4 font-semibold">Resumo do pedido</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li
                key={i.variantId}
                className="flex justify-between gap-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {i.quantity}× {i.name} ({i.size}/{i.color})
                </span>
                <span>{formatBRL(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frete</span>
              <span>{formatBRL(SHIPPING_FEE)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </div>
          <Button
            type="submit"
            className="mt-5 w-full"
            size="lg"
            disabled={isLoading}
            data-testid="place-order"
          >
            {isLoading ? "Gerando PIX..." : "Gerar PIX e finalizar"}
          </Button>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
