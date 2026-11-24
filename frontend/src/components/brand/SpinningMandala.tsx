import { useLayoutEffect, useRef } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Envolve uma mandala decorativa (marca d'água) com rotação ultra-lenta —
 * 120s por volta, praticamente imperceptível (ver `.mandala-spin` em index.css).
 *
 * - Pausa quando sai da viewport (IntersectionObserver) ou quando a aba está
 *   oculta (`document.hidden`).
 * - `will-change: transform` só enquanto girando; removido ao pausar.
 * - `prefers-reduced-motion: reduce` → estática (tratado no CSS).
 *
 * A cor/opacidade vêm do `className` (ex.: `text-primary/5`) e são herdadas
 * pela svg via `currentColor`. **Não eleve a opacidade** além de 4–8%.
 * Passe a mandala como filho com `className="h-full w-full"`.
 */
export function SpinningMandala({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let inView = false;
    const sync = () => {
      const run = inView && !document.hidden;
      el.classList.toggle("is-paused", !run);
      el.style.willChange = run ? "transform" : "";
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("mandala-spin is-paused", className)}
    >
      {children}
    </span>
  );
}
