export interface BetterAuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  image?: string | null;
}

export interface BetterAuthSession {
  token?: string;
  expiresAt?: string;
  // outros campos que seu backend possa retornar
}

export interface BetterAuthResponse<T = BetterAuthUser> {
  data?: {
    user: T;
    session?: BetterAuthSession;
  };
  user?: T;
  session?: BetterAuthSession;
  error?: {
    message: string;
    status: number;
  };
}

export interface ApiError {
  status: number;
  data: string;
}
