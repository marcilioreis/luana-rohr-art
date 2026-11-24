import { useLayoutEffect, useRef } from "react";

type ParallaxOptions = {
  /**
   * Fração do deslocamento do elemento (centro em relação ao centro da
   * viewport) aplicada como translateY. Valores pequenos = profundidade sutil.
   * - Hero: ~0.08  → aproxima a ideia de "fundo a 0.3x do scroll" (o clamp de
   *   40px domina o movimento, então o número exato quase não importa).
   * - Retrato/ateliê: ~0.05 → mais contido ("0.85x" ≈ lag de ~0.15x), clamp 24px.
   */
  strength: number;
  /** Deslocamento máximo em px (clamp). Hero: 40 · retrato: 24. */
  max: number;
  /** Largura mínima da viewport para ativar — só desktop. Padrão 1024. */
  minWidth?: number;
};

/**
 * Parallax vertical sutil, server-safe e reversível.
 *
 * - Só anima `transform` (translate3d) — nunca top/background-position.
 * - Ativo apenas em desktop (`min-width`) e com ponteiro/scroll normal.
 * - Listener de scroll `{ passive: true }`, throttle de 1 atualização por frame
 *   via `requestAnimationFrame`.
 * - `will-change: transform` só enquanto ativo (removido ao desativar).
 * - `prefers-reduced-motion: reduce` → desliga e limpa o transform.
 *
 * Retorna um ref para anexar ao elemento que deve "flutuar".
 */
export function useParallax<T extends HTMLElement = HTMLElement>({
  strength,
  max,
  minWidth = 1024,
}: ParallaxOptions) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia(`(min-width: ${minWidth}px)`);

    let frame = 0;
    let active = false;

    const clear = () => {
      el.style.transform = "";
      el.style.willChange = "";
    };

    const render = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Deslocamento do centro do elemento vs. centro da viewport. É 0 quando o
      // elemento está centralizado → movimento simétrico e sem "salto" ao montar.
      const centerDelta = rect.top + rect.height / 2 - vh / 2;
      const y = Math.max(-max, Math.min(max, centerDelta * strength));
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    };

    const onScroll = () => {
      if (frame) return; // throttle por frame (não por timestamp)
      frame = requestAnimationFrame(render);
    };

    const enable = () => {
      if (active) return;
      active = true;
      el.style.willChange = "transform";
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      render();
    };

    const disable = () => {
      if (!active) return;
      active = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      clear();
    };

    const sync = () => {
      if (reduce.matches || !desktop.matches) disable();
      else enable();
    };

    sync();
    reduce.addEventListener("change", sync);
    desktop.addEventListener("change", sync);

    return () => {
      reduce.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
      disable();
    };
  }, [strength, max, minWidth]);

  return ref;
}
