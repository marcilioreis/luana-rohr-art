import { useLayoutEffect, useRef } from "react";
import { Mandala } from "./Mandala";
import { cn } from "@/lib/utils";

/**
 * Separador mandálico entre blocos grandes da Home. Line-art azul da artista
 * (componente `Mandala`), stroke 1px, opacidade 30%, ~80px.
 *
 * Ao entrar na viewport, o traço se "desenha" (stroke-dasharray/offset) em
 * 1200ms ease-in-out, **uma única vez** (ver `.mandala-divider` em index.css).
 * `prefers-reduced-motion` ou no-JS → aparece já desenhado.
 */
export function MandalaDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !("IntersectionObserver" in window)) {
      el.dataset.draw = "in";
      return;
    }

    el.dataset.draw = "out";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.draw = "in";
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "mandala-divider flex justify-center py-8 text-primary/30",
        className,
      )}
    >
      <Mandala strokeWidth={1} className="h-20 w-20" />
    </div>
  );
}
