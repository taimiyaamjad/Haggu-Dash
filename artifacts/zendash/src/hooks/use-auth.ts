import { useQueryClient } from "@tanstack/react-query";
import { useGetCurrentAuthUser, getGetCurrentAuthUserQueryKey } from "@workspace/api-client-react";

export type AuthUserData = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImageUrl?: string | null;
};

export function useAuth() {
  const { data, isLoading } = useGetCurrentAuthUser();
  const queryClient = useQueryClient();

  const user = data?.user ?? null;
  const isAuthenticated = !!user;

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }
    await queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
  }

  async function register(data: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Registration failed");
    }
    await queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
  }

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    await queryClient.invalidateQueries({ queryKey: getGetCurrentAuthUserQueryKey() });
  }

  return { user, isAuthenticated, isLoading, login, register, logout };
}
