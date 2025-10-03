import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";

const apiClient: AxiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImU4MWYwNTJhZWYwNDBhOTdjMzlkMjY1MzgxZGU2Y2I0MzRiYzM1ZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbmV4dC1mYXJlIiwiYXVkIjoibmV4dC1mYXJlIiwiYXV0aF90aW1lIjoxNzU5NTA3NzA4LCJ1c2VyX2lkIjoicnYwOE9ZdmdOcmdYVmtCTWladXd1Y05MdEdjMiIsInN1YiI6InJ2MDhPWXZnTnJnWFZrQk1pWnV3dWNOTHRHYzIiLCJpYXQiOjE3NTk1MDc3MDgsImV4cCI6MTc1OTUxMTMwOCwiZW1haWwiOiJ1c2VyMUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ1c2VyMUBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.EI-ypepuY4bpyzfvdOwC2VPnIsZPzHoH1_NJVe3XOBlayksD3-X66vUFrWc3dkoChB4EDnBwp-pTQKJgw6fmaxiTAaYX9lb9ZwoIcCrJ3-72tJaeDzYVCrZylL-RoEbfTxCZe3AEkastdQQuedRR6FoNZx13kSvE_uQmRrmzAfp7ofoOMnN9gnc_dDgrMn-CwqJyIvrGTKnFep36aewTeFJKdurmZYKhFZGWgWu2s-0zSOnjEuvtoUXLNOPNCJm1E2RypPb6rbjbg1k1Oo4TZKu63L30ZgwX_JpzdhJ4AcogwbghMu1v4xRYp8pZExnWykP3BCRTJgbZm6lSq9vNjw",
  },
});

// Request interceptor for logging
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

// Response interceptor for logging and error handling
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
