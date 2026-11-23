import type { CSSProperties } from "react";
import { useTheme, type ResolvedTheme } from "./theme";

/**
 * Paleta dos gráficos (Recharts).
 *
 * O Recharts recebe cor como string em atributo SVG (`stroke`, `fill`), e
 * `var(--x)` não é resolvido em atributo de apresentação — por isso os valores
 * são literais aqui, em vez de lidos dos tokens.
 *
 * Espelha `--chart-1..6` e `--muted-foreground` de `index.css`: mudou lá,
 * mude aqui. A exceção é `grid`, um pouco mais forte que `--border` no tema
 * escuro — a 12% a malha sumia atrás das barras.
 */
export interface ChartColors {
  grid: string;
  axis: string;
  blue: string;
  red: string;
  lightBlue: string;
  amber: string;
  neutral: string;
  green: string;
}

const PALETTES: Record<ResolvedTheme, ChartColors> = {
  light: {
    grid: "oklch(0.9 0.008 83)", // --border
    axis: "oklch(0.52 0.015 290)", // --muted-foreground
    blue: "oklch(0.42 0.14 263)", // --chart-1
    red: "oklch(0.56 0.2 28)", // --chart-2
    lightBlue: "oklch(0.6 0.08 230)", // --chart-3
    amber: "oklch(0.72 0.11 55)", // --chart-4
    neutral: "oklch(0.5 0.02 285)", // --chart-5
    green: "oklch(0.52 0.12 155)", // --chart-6
  },
  dark: {
    grid: "oklch(1 0 0 / 18%)",
    axis: "oklch(0.72 0.02 280)",
    blue: "oklch(0.72 0.12 258)",
    red: "oklch(0.68 0.19 28)",
    lightBlue: "oklch(0.6 0.08 230)",
    amber: "oklch(0.72 0.11 55)",
    neutral: "oklch(0.7 0.02 285)",
    green: "oklch(0.72 0.13 158)",
  },
};

/** Cores de gráfico do tema atual. */
export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  return PALETTES[resolvedTheme];
}

/**
 * Tooltip do Recharts. Aqui `var()` funciona: é style inline (declaração CSS),
 * não atributo SVG.
 */
export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
};

export const CHART_TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--popover-foreground)",
};
