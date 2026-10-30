// src/types/better-auth.d.ts
import 'better-auth';

declare module 'better-auth' {
  interface User {
    role?: string | null;
    id: string;
    active?: boolean;
  }
}
