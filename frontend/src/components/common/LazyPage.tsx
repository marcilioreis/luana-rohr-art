// src/components/common/LazyPage.tsx
import { lazy, Suspense, type ComponentType } from "react";
import Skeleton from "../../components/common/Skeleton";

export function lazyPage(
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
) {
  const LazyComponent = lazy(importFn);
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg shadow-sm space-y-2"
            >
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      }
    >
      <LazyComponent />
    </Suspense>
  );
}
