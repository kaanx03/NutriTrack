// src/services/AuthService.js - Updated
const API_URL = "http://10.0.2.2:3001";

async function request(path, data) {
  try {
    console.log(`Making request to: ${API_URL}${path}`);
    console.log("Request data:", data);

    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      timeout: 10000,
    });

    console.log("Response status:", response.status);

    const result = await response.json();
    console.log("Response data:", result);

    if (!response.ok) {
      const message = result.error || `HTTP Error: ${response.status}`;
      throw new Error(message);
    }
    return result;
  } catch (error) {
    console.error("Request error:", error);
    if (error.message.includes("Network request failed")) {
      throw new Error(
        "Backend sunucusuna bağlanılamıyor. Sunucunun çalıştığından emin olun."
      );
    }
    throw error;
  }
}

export default {
  signup(user) {
    return request("/api/signup", user);
  },
  login(credentials) {
    return request("/api/login", credentials);
  },
  // Yeni: Kullanıcı profilini çekme
  getUserProfile(userId) {
    return request("/api/user-profile", { userId });
  },
};
