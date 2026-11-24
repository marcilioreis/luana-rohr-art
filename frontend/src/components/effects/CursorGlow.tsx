import { useEffect, useRef } from "react";

/**
 * Glow radial suave (azul, opacidade máx. 5%) que segue o cursor com easing de
 * 200ms (ver `.cursor-glow` em index.css). Atmosfera — nunca espetáculo.
 *
 * - Renderiza **só** em desktop com ponteiro fino (`hover: hover` + `pointer: fine`).
 * - Não aparece em touch nem com `prefers-reduced-motion`.
 * - `pointer-events: none` → nunca bloqueia clique.
 * - Usar apenas na Home e no Sobre (montado por essas páginas).
 *
 * Opcional: para desligar, basta remover `<CursorGlow />` das páginas.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || reduce.matches) return; // não renderiza em touch/reduced

    let frame = 0;
    let x = 0;
    let y = 0;
    let shown = false;

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (frame) return; // throttle por frame
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!shown) {
          el.style.opacity = "1";
          shown = true;
        }
        // 400 = metade de 800px (raio ~400px) → centraliza o gradiente no cursor
        el.style.transform = `translate3d(${x - 400}px, ${y - 400}px, 0)`;
      });
    };

    window.addEventListener("mousemove", move, { passive: true });
    return () => {
      window.removeEventListener("mousemove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="cursor-glow" />;
}
