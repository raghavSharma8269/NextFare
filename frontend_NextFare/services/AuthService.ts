import axios from "axios";
import Constants from "expo-constants";
import {
  FirebaseAuthResponse,
  FirebaseRefreshResponse,
  LoginCredentials,
  RegisterData,
  AuthError,
} from "../types/auth";

const FIREBASE_API_KEY = Constants.expoConfig?.extra?.firebaseApiKey || "";

class AuthService {
  private readonly signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  private readonly signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  private readonly refreshUrl = `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`;

  async register(data: RegisterData): Promise<FirebaseAuthResponse> {
    try {
      if (data.password.length < 6) {
        throw {
          code: "WEAK_PASSWORD",
          message: "Password must be at least 6 characters long",
        } as AuthError;
      }

      const response = await axios.post<FirebaseAuthResponse>(this.signUpUrl, {
        email: data.email,
        password: data.password,
        returnSecureToken: true,
      });

      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async login(credentials: LoginCredentials): Promise<FirebaseAuthResponse> {
    try {
      const response = await axios.post<FirebaseAuthResponse>(this.signInUrl, {
        email: credentials.email,
        password: credentials.password,
        returnSecureToken: true,
      });

      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async refreshToken(refreshToken: string): Promise<FirebaseRefreshResponse> {
    try {
      const response = await axios.post<FirebaseRefreshResponse>(
        this.refreshUrl,
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }
      );

      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  private handleAuthError(error: any): AuthError {
    if (error.response?.data?.error) {
      const firebaseError = error.response.data.error;

      switch (firebaseError.message) {
        case "EMAIL_EXISTS":
          return {
            code: "EMAIL_EXISTS",
            message: "This email is already registered. Please login instead.",
          };
        case "INVALID_EMAIL":
          return {
            code: "INVALID_EMAIL",
            message: "Please enter a valid email address.",
          };
        case "WEAK_PASSWORD : Password should be at least 6 characters":
        case "WEAK_PASSWORD":
          return {
            code: "WEAK_PASSWORD",
            message: "Password must be at least 6 characters long.",
          };
        case "EMAIL_NOT_FOUND":
          return {
            code: "EMAIL_NOT_FOUND",
            message: "No account found with this email.",
          };
        case "INVALID_PASSWORD":
        case "INVALID_LOGIN_CREDENTIALS":
          return {
            code: "INVALID_PASSWORD",
            message: "Incorrect password or email. Please try again.",
          };
        case "USER_DISABLED":
          return {
            code: "USER_DISABLED",
            message: "This account has been disabled.",
          };
        case "TOO_MANY_ATTEMPTS_TRY_LATER":
          return {
            code: "TOO_MANY_ATTEMPTS",
            message: "Too many failed attempts. Please try again later.",
          };
        default:
          return {
            code: "UNKNOWN_ERROR",
            message:
              firebaseError.message ||
              "An error occurred during authentication.",
          };
      }
    }

    if (error.message === "Network Error") {
      return {
        code: "NETWORK_ERROR",
        message: "Unable to connect. Please check your internet connection.",
      };
    }

    if (error.code && error.message) {
      return error;
    }

    return {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred. Please try again.",
    };
  }
}

export default new AuthService();
