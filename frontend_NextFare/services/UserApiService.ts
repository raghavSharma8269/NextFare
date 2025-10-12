import client from "../types/client";
import { User, CreateUserRequest, UpdateLocationRequest } from "../types/user";

class UserApiService {
  async getProfile(): Promise<User> {
    try {
      const response = await client.get<User>("/api/users/profile");
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error("User profile not found");
      }
      throw new Error("Failed to fetch user profile");
    }
  }

  async createOrUpdateProfile(data: CreateUserRequest): Promise<User> {
    try {
      const response = await client.post<User>("/api/users/profile", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || "Invalid profile data");
      }
      throw new Error("Failed to create user profile");
    }
  }

  async updateLocation(location: UpdateLocationRequest): Promise<string> {
    try {
      const response = await client.post<string>(
        "/api/users/profile/location",
        location
      );
      return response.data;
    } catch (error: any) {
      throw new Error("Failed to update location");
    }
  }
}

export default new UserApiService();
