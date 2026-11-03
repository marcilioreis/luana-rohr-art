import { cn } from "@/lib/utils";

/**
 * Marca da Luana Rohr — mandala em line-art (traço fino, sem preenchimento).
 * Herda a cor via `currentColor` (use `text-primary`, `text-brand-red`,
 * `text-primary/5` para marca d'água etc.). Usada no header, footer e loading.
 */
export function Mandala({
  className,
  strokeWidth = 2,
  petals = 12,
}: {
  className?: string;
  strokeWidth?: number;
  petals?: number;
}) {
  const ring = (rx: number, ry: number, cy: number, offset = 0) =>
    Array.from({ length: petals }, (_, i) => (
      <ellipse
        key={`${cy}-${i}`}
        cx="50"
        cy={cy}
        rx={rx}
        ry={ry}
        transform={`rotate(${(360 / petals) * i + offset} 50 50)`}
      />
    ));

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" />
      <circle cx="50" cy="50" r="33" />
      <circle cx="50" cy="50" r="18" />
      <circle cx="50" cy="50" r="5" />
      {ring(5, 13, 24)}
      {ring(3.5, 8, 33, 360 / petals / 2)}
    </svg>
  );
}
