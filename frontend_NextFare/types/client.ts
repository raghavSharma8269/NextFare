import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";

const apiClient: AxiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImU4MWYwNTJhZWYwNDBhOTdjMzlkMjY1MzgxZGU2Y2I0MzRiYzM1ZjMiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbmV4dC1mYXJlIiwiYXVkIjoibmV4dC1mYXJlIiwiYXV0aF90aW1lIjoxNzU5NTEyMDQ1LCJ1c2VyX2lkIjoicnYwOE9ZdmdOcmdYVmtCTWladXd1Y05MdEdjMiIsInN1YiI6InJ2MDhPWXZnTnJnWFZrQk1pWnV3dWNOTHRHYzIiLCJpYXQiOjE3NTk1MTIwNDUsImV4cCI6MTc1OTUxNTY0NSwiZW1haWwiOiJ1c2VyMUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ1c2VyMUBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.RYe4-FjLQJ26USCGda2i6-aLeEWR4Uuuus-Xa3313SZHgMxixD02y_BQxQMTRBfOgFtDrkHN_vm1M4jDjMN5Ct24TqLr3Ki_AQNFNfeMeXPklKFZmGE_jQ0lNP0c5lheBnL5-AGq6ZLGHF-TOorMaDHOuR0GsHsRqmmvAx0kNveDc7m9IqzGkWGmm6fghO1MVZeXaFm8qK77L_R9UFCI4lP1uW-TXSClRFyqs4mC3FYVMA98SkhqoVxHTxZoBo7B__TVldYcF0dvLNg7aYqx8KldgJfBTv6H9mRppF5SrSpr55EsmTbAQN6e_3QiHCt20flZ_f9qmlgWHyHmP5lSSQ",
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
