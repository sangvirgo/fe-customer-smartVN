import axiosInstance from "./axios"

const authService = {
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    })
    return response.data.data
  },

  register: async (firstName, lastName, email, password) => {
    const response = await axiosInstance.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
    })
    return response.data
  },

  verifyOtp: async (email, otp) => {
    const response = await axiosInstance.post("/auth/register/verify", {
      email,
      otp,
    })
    return response.data
  },

  resendOtp: async (email) => {
    const response = await axiosInstance.post("/auth/register/resend-otp", {
      email,
    })
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post("/auth/forgot-password", {
      email,
    })
    return response.data
  },

  resetPassword: async (email, otp, newPassword) => {
    const response = await axiosInstance.post("/auth/reset-password", {
      email,
      otp,
      newPassword,
    })
    return response.data
  },

  logout: () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("user")
  },
}

export default authService