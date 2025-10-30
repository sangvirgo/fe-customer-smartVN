import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ========================
// REQUEST INTERCEPTOR
// ========================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ========================
// RESPONSE INTERCEPTOR - ENHANCED
// ========================
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || data?.error || "Đã có lỗi xảy ra.";

      // ✅ HANDLE 401 - Token hết hạn / Invalid token
      if (status === 401) {
        console.error("❌ 401 Unauthorized:", errorMessage);
        
        // Clear storage
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("auth-change"));

        // Show toast nếu có message cụ thể
        if (window.showToast) {
          window.showToast(errorMessage, "error");
        }

        // Redirect to login (tránh loop)
        if (window.location.pathname !== "/login") {
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500); // Delay để user đọc toast
        }

        return Promise.reject(new Error(errorMessage));
      }

      // ✅ HANDLE 403 - Tài khoản bị khóa/ban hoặc thiếu quyền
      if (status === 403) {
        console.error("❌ 403 Forbidden:", errorMessage);

        // Kiểm tra message có chứa từ khóa "khóa" hay "ban"
        const isAccountLocked = errorMessage.toLowerCase().includes("khóa") || 
                               errorMessage.toLowerCase().includes("ban") ||
                               errorMessage.toLowerCase().includes("locked");

        if (isAccountLocked) {
          // Clear storage và logout
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("auth-change"));

          // Show error modal/toast
          if (window.showToast) {
            window.showToast(errorMessage, "error");
          }

          // Redirect về login sau delay
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          // Trường hợp 403 khác (thiếu quyền truy cập resource)
          if (window.showToast) {
            window.showToast(errorMessage || "Bạn không có quyền truy cập", "error");
          }
        }

        return Promise.reject(new Error(errorMessage));
      }

      // ✅ HANDLE 404 - Not Found
      if (status === 404) {
        console.warn("⚠️ 404 Not Found:", errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // ✅ HANDLE 400 - Bad Request / Validation errors
      if (status === 400) {
        console.warn("⚠️ 400 Bad Request:", errorMessage);
        return Promise.reject(new Error(errorMessage));
      }

      // ✅ HANDLE 500 - Server Error
      if (status >= 500) {
        console.error("❌ Server Error:", errorMessage);
        return Promise.reject(new Error("Lỗi server. Vui lòng thử lại sau."));
      }

      // ✅ Other HTTP errors
      return Promise.reject(new Error(errorMessage));

    } else if (error.request) {
      // ✅ Network Error - Không nhận được response
      console.error("❌ Network Error:", error.message);
      return Promise.reject(new Error("Lỗi mạng. Vui lòng kiểm tra kết nối."));
    } else {
      // ✅ Request setup error
      console.error("❌ Axios Error:", error.message);
      return Promise.reject(new Error("Đã có lỗi xảy ra khi gửi yêu cầu."));
    }
  }
);

export default axiosInstance;