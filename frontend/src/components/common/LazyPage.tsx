// src/components/common/LazyPage.tsx
import { lazy, Suspense, type ComponentType } from "react";
import PageLoader from "./PageLoader";

export function lazyPage(
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
) {
  const LazyComponent = lazy(importFn);
  return (
    <Suspense fallback={<PageLoader />}>
      <LazyComponent />
    </Suspense>
  );
}
