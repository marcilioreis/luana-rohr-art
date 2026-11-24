import { useCallback, useLayoutEffect, useRef } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealTag = "div" | "section" | "article" | "aside" | "li";

type RevealProps = {
  /** Elemento renderizado. Padrão: div. */
  as?: RevealTag;
  /** Atraso (ms) para stagger entre itens de uma mesma grade (80ms × índice). */
  delay?: number;
  /** threshold do IntersectionObserver. Padrão 0.15. */
  threshold?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "style" | "className" | "children">;

/**
 * Revela o conteúdo ao entrar na viewport: opacity 0→1 + translateY 16px→0,
 * 400ms ease-out (ver `.reveal` em index.css). Dispara **uma única vez**.
 *
 * Acessibilidade / no-JS:
 * - Sem JS, o atributo `[data-reveal]` nunca é definido → o conteúdo fica
 *   visível por padrão (o CSS só esconde quando `[data-reveal="out"]`).
 * - `prefers-reduced-motion` ou elemento já acima da dobra → aparece direto,
 *   sem animar (evita flash).
 */
export function Reveal({
  as = "div",
  delay = 0,
  threshold = 0.15,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const setRef = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.dataset.reveal = "in";
      return;
    }

    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Já visível ao montar (acima da dobra): mostra sem animar, evitando um
    // flash de "esconde → revela" logo no primeiro paint.
    if (el.getBoundingClientRect().top < vh * 0.9) {
      el.dataset.reveal = "in";
      return;
    }

    el.dataset.reveal = "out";
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "in";
          obs.disconnect(); // uma vez só — não reanima ao subir/descer
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const Tag = as;
  return (
    <Tag
      ref={setRef as never}
      className={cn("reveal", className)}
      style={{ ...style, ["--reveal-delay"]: `${delay}ms` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
