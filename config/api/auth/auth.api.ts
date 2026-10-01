import { apiClient, API_BASE_URL } from "../client";
import type { User } from "../user/user.types";

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Login failed");
  }

  if (!result.data) {
    throw new Error("Invalid response from server");
  }

  const { token, user } = result.data;

  if (user.role !== "admin") {
    throw new Error("Access denied. Admin only.");
  }

  if (!user.isApproved) {
    throw new Error(
      "Account pending approval. Please wait for admin approval.",
    );
  }

  apiClient.setToken(token);
  apiClient.setUser(user);

  return { token, user };
}
