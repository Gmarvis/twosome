import type { UserId } from "@twosome/shared";

export interface AuthUser {
  id: UserId;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  provider: "anonymous" | "google" | "apple" | null;
}

export interface AuthPort {
  signInAnonymously(): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  signInWithApple(): Promise<AuthUser>;
  linkWithGoogle(): Promise<AuthUser>;
  linkWithApple(): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}
