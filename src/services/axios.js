import axios from "axios";
import { handleAuthError } from "../utils/authUtils";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR - ENHANCED với authUtils
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sử dụng handleAuthError từ authUtils
    const isAuthError = handleAuthError(error);
    
    // Nếu không phải lỗi auth, xử lý các lỗi khác
    if (!isAuthError && error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.error || "Đã có lỗi xảy ra.";

      // 404 - Not Found
      if (status === 404) {
        console.warn("⚠️ 404 Not Found:", errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // 400 - Bad Request
      if (status === 400) {
        console.warn("⚠️ 400 Bad Request:", errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // 500+ - Server Error
      if (status >= 500) {
        console.error("❌ Server Error:", errorMessage);
        return Promise.reject(new Error("Lỗi server. Vui lòng thử lại sau."));
      }

      return Promise.reject(new Error(errorMessage));
    }

    // Network Error
    if (error.request && !error.response) {
      console.error("❌ Network Error:", error.message);
      return Promise.reject(new Error("Lỗi mạng. Vui lòng kiểm tra kết nối."));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;