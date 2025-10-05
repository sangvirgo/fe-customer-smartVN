import axiosInstance from "./axios"

const productService = {
  getProducts: async (params = {}) => {
    const {
      page = 0,
      size = 20,
      keyword = "",
      topLevelCategory = "",
      secondLevelCategory = "",
      minPrice = "",
      maxPrice = "",
      sort = "popular",
    } = params

    const queryParams = new URLSearchParams()
    queryParams.append("page", page)
    queryParams.append("size", size)
    if (keyword) queryParams.append("keyword", keyword)
    if (topLevelCategory) queryParams.append("topLevelCategory", topLevelCategory)
    if (secondLevelCategory) queryParams.append("secondLevelCategory", secondLevelCategory)
    if (minPrice) queryParams.append("minPrice", minPrice)
    if (maxPrice) queryParams.append("maxPrice", maxPrice)

    const response = await axiosInstance.get(`/products?${queryParams.toString()}`)
    return response.data
  },

  getProductById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`)
    return response.data
  },

  getProductReviews: async (productId, page = 0, size = 10) => {
    const response = await axiosInstance.get(`/products/${productId}/reviews?page=${page}&size=${size}`)
    return response.data
  },

  createReview: async (productId, rating, content) => {
    const response = await axiosInstance.post(`/products/${productId}/reviews`, {
      rating,
      content,
    })
    return response.data
  },
}

export default productService
