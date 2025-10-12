import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "authToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";

export const tokenStorage = {
  // Save authentication tokens
  async saveTokens(
    idToken: string,
    refreshToken: string,
    userId: string
  ): Promise<void> {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, idToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
        SecureStore.setItemAsync(USER_ID_KEY, userId),
      ]);
    } catch (error) {
      console.error("Error saving tokens:", error);
      throw new Error("Failed to save authentication tokens");
    }
  },

  async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  },

  async getUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(USER_ID_KEY);
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  },

  // Update just the access token (used during refresh)
  async updateToken(idToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, idToken);
    } catch (error) {
      console.error("Error updating token:", error);
      throw new Error("Failed to update authentication token");
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_ID_KEY),
      ]);
    } catch (error) {
      console.error("Error clearing tokens:", error);
      throw new Error("Failed to clear authentication tokens");
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  },
};
