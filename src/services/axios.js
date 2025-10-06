import axios from "axios"

// Create axios instance with base URL from environment variable
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor to add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error codes
      const { status, data } = error.response

      if (status === 401) {
        // Unauthorized - clear token and redirect to login
        localStorage.removeItem("accessToken")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }

      // Return error message from API or default message
      const errorMessage = data?.message || "An error occurred"
      return Promise.reject(new Error(errorMessage))
    }

    return Promise.reject(new Error("Network error. Please try again."))
  },
)

export default axiosInstance