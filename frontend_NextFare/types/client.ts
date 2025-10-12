import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";

const apiClient: AxiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// request interceptor for logging and adding auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `API Response: ${response.status} - ${
        response.data?.length || "N/A"
      } items`
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error("API Network Error:", error.message);
    } else {
      console.error("API Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
