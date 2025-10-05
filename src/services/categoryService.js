import axiosInstance from "./axios"

const categoryService = {
  getCategories: async () => {
    const response = await axiosInstance.get("/categories")
    return response.data
  },

  getCategoryById: async (id) => {
    const response = await axiosInstance.get(`/categories/${id}`)
    return response.data
  },
}

export default categoryService
