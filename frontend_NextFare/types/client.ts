import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";

const apiClient: AxiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.apiBaseUrl || "http://localhost:8080",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Authorization:
      "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImE1YTAwNWU5N2NiMWU0MjczMDBlNTJjZGQ1MGYwYjM2Y2Q4MDYyOWIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vbmV4dC1mYXJlIiwiYXVkIjoibmV4dC1mYXJlIiwiYXV0aF90aW1lIjoxNzYwMTA5NDI0LCJ1c2VyX2lkIjoicnYwOE9ZdmdOcmdYVmtCTWladXd1Y05MdEdjMiIsInN1YiI6InJ2MDhPWXZnTnJnWFZrQk1pWnV3dWNOTHRHYzIiLCJpYXQiOjE3NjAxMDk0MjQsImV4cCI6MTc2MDExMzAyNCwiZW1haWwiOiJ1c2VyMUBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ1c2VyMUBleGFtcGxlLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.UiMaYPggnFZ9KVgptaySaViOxTT8LENNS1I6oj0PfpkWDPmowKh7MGDE7C03hETOu8SsldkxclME79UT5DTy6RIz-uJLFU0FpQ-9bhLyWCH_VdtQlgJsyUV03KmNn4jAHhZKqJ0P6nmgyIr2MZalSK_Wm7kMUZn-PRnLEdtCFVcJxm4hQJEKH7ExbMzcK5XcyZcPY06RLDnlvNNSMiFe8nzMenpcIbVqO1mRlOMcGUpQuIXly0-T4kkOPJ-OvxR6lReHyrxhV7m8cpjtKTI1NrqS6fCsl4myagGJGGqdQKdQxd0C127ZD7gv0-YsLakVvJ52lPy2HOD-ngU_bp3Hew",
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
