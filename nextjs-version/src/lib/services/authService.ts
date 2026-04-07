const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1") + "/auth";

export const authService = {
  async register(data: any) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Registration failed");
    return result.data; // { user, accessToken, refreshToken }
  },

  async login(data: any) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Login failed");
    return result.data; // { user, accessToken, refreshToken }
  }
};
