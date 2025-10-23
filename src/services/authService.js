import axiosInstance from "./axios";

const authService = {
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    // Lưu token và user data vào localStorage sau khi đăng nhập thành công
    if (response.data?.data?.accessToken && response.data?.data?.user) {
      localStorage.setItem("accessToken", response.data.data.accessToken);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }
    return response.data.data; // Trả về { accessToken, user }
  },

  register: async (firstName, lastName, email, password) => {
    const response = await axiosInstance.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
    });
    return response.data; // Trả về { message }
  },

  verifyOtp: async (email, otp) => {
    const response = await axiosInstance.post("/auth/register/verify", {
      email,
      otp,
    });
    return response.data; // Trả về { message }
  },

  resendOtp: async (email) => {
    const response = await axiosInstance.post("/auth/register/resend-otp", {
      email,
    });
    return response.data; // Trả về { message }
  },

  // Đã sửa: Gộp forgot password và reset password vào một hàm gọi API duy nhất
// Thêm function này (hoặc đổi tên forgotPasswordReset thành forgotPassword)
forgotPassword: async (email) => {
  const response = await axiosInstance.post("/auth/register/resend-otp", {
    email,
  });
  return response.data;
},

resetPassword: async (email, otp, newPassword) => {
  const response = await axiosInstance.post("/auth/register/forgot-password", {
    email,
    otp,
    newPassword,
  });
  return response.data;
},

  logout: () => {
    // Xóa token và user data khỏi localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    // Có thể thêm việc gọi API logout của backend nếu có
    // await axiosInstance.post("/auth/logout");
    console.log("Logged out");
  },

  // Helper để lấy thông tin user từ localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Helper để lấy access token
  getAccessToken: () => {
    return localStorage.getItem("accessToken");
  }
};

export default authService;