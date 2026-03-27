import type { UserId } from "@twosome/shared";
import type { AuthPort, AuthUser } from "@twosome/application";
import { getSupabaseClient } from "../supabase/client";

export class SupabaseAuthAdapter implements AuthPort {
  private get auth() {
    return getSupabaseClient().auth;
  }

  async signInAnonymously(): Promise<AuthUser> {
    const { data, error } = await this.auth.signInAnonymously();
    if (error || !data.user) throw new Error(`Anonymous sign-in failed: ${error?.message}`);
    return this.mapUser(data.user);
  }

  async signInWithGoogle(): Promise<AuthUser> {
    const { error } = await this.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(`Google sign-in failed: ${error.message}`);
    // OAuth redirects — user will be available after redirect
    return this.getCurrentUser() as Promise<AuthUser>;
  }

  async signInWithApple(): Promise<AuthUser> {
    const { error } = await this.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(`Apple sign-in failed: ${error.message}`);
    return this.getCurrentUser() as Promise<AuthUser>;
  }

  async linkWithGoogle(): Promise<AuthUser> {
    const { error } = await this.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(`Google link failed: ${error.message}`);
    return this.getCurrentUser() as Promise<AuthUser>;
  }

  async linkWithApple(): Promise<AuthUser> {
    const { error } = await this.auth.linkIdentity({
      provider: "apple",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(`Apple link failed: ${error.message}`);
    return this.getCurrentUser() as Promise<AuthUser>;
  }

  async signOut(): Promise<void> {
    const { error } = await this.auth.signOut();
    if (error) throw new Error(`Sign out failed: ${error.message}`);
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await this.auth.getUser();
    if (!user) return null;
    return this.mapUser(user);
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    const { data: { subscription } } = this.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback(this.mapUser(session.user));
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  }

  private mapUser(user: any): AuthUser {
    const isAnonymous = user.is_anonymous ?? !user.email;
    const meta = user.user_metadata ?? {};

    return {
      id: user.id as UserId,
      isAnonymous,
      email: user.email ?? null,
      displayName: meta.full_name ?? meta.name ?? null,
      avatarUrl: meta.avatar_url ?? null,
      provider: isAnonymous
        ? "anonymous"
        : user.app_metadata?.provider === "google"
          ? "google"
          : user.app_metadata?.provider === "apple"
            ? "apple"
            : null,
    };
  }
}
