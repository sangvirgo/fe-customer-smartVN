import axios from "axios";

// Tạo instance axios với baseURL từ biến môi trường hoặc mặc định
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1", // Đảm bảo đúng cổng API Gateway
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor cho request: Tự động thêm token vào header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Lấy token từ localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Thêm header Authorization
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor cho response: Xử lý lỗi tập trung
axiosInstance.interceptors.response.use(
  (response) => {
    // Nếu backend trả về cấu trúc { data: ..., message: ... } hoặc tương tự,
    // bạn có thể xử lý để chỉ trả về phần data ở đây nếu muốn.
    // Ví dụ: return response.data;
    // Tuy nhiên, trả về response đầy đủ sẽ linh hoạt hơn.
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Xử lý lỗi 401 Unauthorized: Xóa token, chuyển hướng về login
      if (status === 401) {
        console.error("Unauthorized access - Redirecting to login.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        // Chuyển hướng trang (có thể cần điều chỉnh tùy theo router bạn dùng)
        if (window.location.pathname !== "/login") {
           window.location.href = "/login";
        }
      }

      // Trả về lỗi với message từ API hoặc message mặc định
      const errorMessage = data?.message || data?.error || "Đã có lỗi xảy ra.";
      // Bạn có thể log chi tiết lỗi ở đây nếu cần
      // console.error("API Error:", status, data);
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
       // Lỗi không nhận được phản hồi (vd: network error)
       console.error("Network Error:", error.message);
       return Promise.reject(new Error("Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại."));
    } else {
       // Lỗi khác khi thiết lập request
       console.error("Axios Error:", error.message);
       return Promise.reject(new Error("Đã có lỗi xảy ra khi gửi yêu cầu."));
    }
  },
);

export default axiosInstance;