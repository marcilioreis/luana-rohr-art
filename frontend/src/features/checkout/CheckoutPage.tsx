import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  selectCartItems,
  selectCartSubtotal,
  clearCart,
} from "../cart/cartSlice";
import {
  useCreateOrderMutation,
  useLazyGetShippingQuoteQuery,
} from "../account/ordersApi";
import { fetchAddressByCep, normalizeCep, isValidCep } from "./cep";
import {
  DELIVERY_METHOD_LABELS,
  PICKUP_NOTICE,
  type DeliveryMethod,
} from "../account/orders.types";
import { formatBRL } from "@/utils/format";
import { Mandala } from "@/components/brand/Mandala";
import PageLoader from "@/components/common/PageLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  LogIn,
  UserRound,
  Loader2,
  Truck,
  Store,
  CalendarClock,
} from "lucide-react";

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const user = useAppSelector((s) => s.auth.user);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isLoadingAuth = useAppSelector((s) => s.auth.isLoading);

  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [fetchQuote] = useLazyGetShippingQuoteQuery();
  // Convidado escolhe entrar na conta OU seguir como convidado antes do formulário.
  const [step, setStep] = useState<"choice" | "form">("choice");
  // Modalidade de entrega: entrega (frete por UF) ou retirada (sem custo, agendada).
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("entrega");
  // Frete: calculado no servidor a partir da UF (null = ainda não cotado).
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  const isPickup = deliveryMethod === "retirada";

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

  // Cota o frete pela UF (fonte da verdade é o servidor). UF inválida → zera a cotação.
  const quoteForUf = async (uf: string) => {
    if (uf.trim().length !== 2) {
      setShippingFee(null);
      return;
    }
    try {
      const quote = await fetchQuote(uf.trim().toUpperCase()).unwrap();
      setShippingFee(quote.fee);
    } catch {
      setShippingFee(null);
    }
  };

  // Busca o endereço por CEP (ViaCEP) e preenche os campos; depois cota o frete.
  const handleCepLookup = async (rawCep: string) => {
    if (!isValidCep(rawCep)) return;
    setCepLoading(true);
    try {
      const addr = await fetchAddressByCep(rawCep);
      if (!addr) {
        toast.error("CEP não encontrado.");
        return;
      }
      setForm((f) => ({
        ...f,
        cep: addr.cep,
        street: addr.street || f.street,
        district: addr.district || f.district,
        city: addr.city || f.city,
        state: addr.state || f.state,
      }));
      await quoteForUf(addr.state);
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setCepLoading(false);
    }
  };

  // Aguarda resolução da sessão antes de decidir o fluxo
  if (isLoadingAuth) {
    return <PageLoader />;
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

  // Convidado deslogado: oferece escolha entre entrar ou seguir sem conta.
  if (!isAuthenticated && step === "choice") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Mandala className="mb-4 h-10 w-10 text-primary" />
        <h1 className="mb-2 text-2xl font-medium tracking-tight">
          Finalizar compra
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Como você prefere continuar?
        </p>
        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate("/login", { state: { from: "/checkout" } })}
            data-testid="checkout-login"
          >
            <LogIn className="mr-2 h-4 w-4" /> Entrar na minha conta
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setStep("form")}
            data-testid="checkout-guest"
          >
            <UserRound className="mr-2 h-4 w-4" /> Continuar como convidado
          </Button>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Como convidado você recebe um link para acompanhar o pedido e o PIX.
        </p>
      </div>
    );
  }

  // Frete é autoritativo no servidor; aqui é só exibição. Retirada é sem custo.
  const effectiveShipping = isPickup ? 0 : (shippingFee ?? 0);
  const total = subtotal + effectiveShipping;
  // Pode finalizar: retirada sempre; entrega exige o frete já cotado.
  const canSubmit = isPickup || shippingFee !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Dados do cliente sempre obrigatórios; endereço só na modalidade de entrega.
    const required: Array<keyof typeof form> = isPickup
      ? ["name", "email"]
      : [
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
    if (!isPickup && form.state.trim().length !== 2) {
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
        deliveryMethod,
        // Endereço só na entrega; na retirada é omitido (servidor grava null, frete 0).
        shippingAddress: isPickup
          ? undefined
          : {
              cep: form.cep.trim(),
              street: form.street.trim(),
              number: form.number.trim(),
              complement: form.complement.trim() || undefined,
              district: form.district.trim(),
              city: form.city.trim(),
              state: form.state.trim().toUpperCase(),
            },
        // shippingFee não é enviado: o servidor calcula pelo UF (fonte da verdade).
        notes: form.notes.trim() || undefined,
      }).unwrap();
      dispatch(clearCart());
      if (order.accessToken) {
        // Convidado: página pública persistente com o PIX (reabrível pelo link).
        navigate(`/pedido/${order.accessToken}`);
      } else {
        // Usuário logado (sem token): detalhe do pedido, que já mostra o PIX pendente.
        navigate(`/conta/pedidos/${order.id}`);
      }
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

          <fieldset className="space-y-3 rounded-xl border p-5">
            <legend className="px-1 text-sm font-semibold">
              Modalidade de entrega
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <DeliveryOption
                selected={deliveryMethod === "entrega"}
                onClick={() => setDeliveryMethod("entrega")}
                icon={<Truck className="h-5 w-5" />}
                title={DELIVERY_METHOD_LABELS.entrega}
                subtitle="Frete calculado pelo CEP"
                testid="delivery-entrega"
              />
              <DeliveryOption
                selected={isPickup}
                onClick={() => setDeliveryMethod("retirada")}
                icon={<Store className="h-5 w-5" />}
                title={DELIVERY_METHOD_LABELS.retirada}
                subtitle="Combine data e horário"
                testid="delivery-retirada"
              />
            </div>
            {isPickup && (
              <div
                className="flex gap-2 rounded-md bg-accent/40 p-3 text-xs text-muted-foreground"
                data-testid="pickup-notice"
              >
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                <span>{PICKUP_NOTICE}</span>
              </div>
            )}
          </fieldset>

          {!isPickup && (
            <fieldset className="space-y-4 rounded-xl border p-5">
              <legend className="px-1 text-sm font-semibold">
                Endereço de entrega
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CEP *">
                  <div className="relative">
                    <Input
                      value={form.cep}
                      inputMode="numeric"
                      placeholder="00000-000"
                      onChange={(e) => {
                        const cep = normalizeCep(e.target.value);
                        setForm((f) => ({ ...f, cep }));
                        if (cep.length === 8) handleCepLookup(cep);
                      }}
                      onBlur={(e) => handleCepLookup(e.target.value)}
                      data-testid="co-cep"
                    />
                    {cepLoading && (
                      <Loader2
                        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
                        data-testid="cep-loading"
                      />
                    )}
                  </div>
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
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        state: e.target.value.toUpperCase(),
                      }))
                    }
                    onBlur={(e) => quoteForUf(e.target.value)}
                    data-testid="co-state"
                  />
                </Field>
              </div>
            </fieldset>
          )}

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
              <span className="text-muted-foreground">
                {isPickup ? "Retirada" : "Frete"}
              </span>
              <span data-testid="shipping-fee">
                {isPickup ? (
                  "Grátis"
                ) : shippingFee === null ? (
                  <span className="text-muted-foreground">informe o CEP</span>
                ) : (
                  formatBRL(shippingFee)
                )}
              </span>
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
            disabled={isLoading || !canSubmit}
            data-testid="place-order"
          >
            {isLoading
              ? "Gerando PIX..."
              : !canSubmit
                ? "Informe o CEP para o frete"
                : "Gerar PIX e finalizar"}
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

function DeliveryOption({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  testid,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  testid: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      data-testid={testid}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:bg-accent/40",
      )}
    >
      <span
        className={cn(
          "shrink-0",
          selected ? "text-primary" : "text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}
