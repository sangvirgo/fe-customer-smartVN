import axiosInstance from "./axios";

const productService = {
  getProducts: async (params = {}) => {
    const {
      page = 0,
      size = 12, // Số lượng sản phẩm mỗi trang, có thể điều chỉnh
      keyword, // Bỏ giá trị mặc định "" để không gửi param rỗng
      topLevelCategory,
      secondLevelCategory,
      minPrice,
      maxPrice,
      sort, // Thêm tham số sort nếu cần
    } = params;

    const queryParams = new URLSearchParams({ page, size }); // Khởi tạo với page, size

    // Chỉ thêm param vào query nếu có giá trị
    if (keyword) queryParams.append("keyword", keyword);
    if (topLevelCategory) queryParams.append("topLevelCategory", topLevelCategory);
    if (secondLevelCategory) queryParams.append("secondLevelCategory", secondLevelCategory);
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') queryParams.append("minPrice", minPrice);
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') queryParams.append("maxPrice", maxPrice);
    if (sort) queryParams.append("sort", sort); // Ví dụ: sort=price,asc hoặc sort=quantitySold,desc

    try {
      const response = await axiosInstance.get(`/products?${queryParams.toString()}`);
      // Backend trả về ApiResponse<Page<ProductListingDTO>>
      // Cấu trúc data mong muốn là Page Object: { content: [], totalElements, totalPages, number, size, ... }
      return response.data.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error; // Ném lại lỗi để component xử lý
    }
  },

  getProductById: async (id) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      // Backend trả về ApiResponse<ProductDetailDTO>
      return response.data.data; // Trả về ProductDetailDTO
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  },

  getProductReviews: async (productId, page = 0, size = 5) => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/reviews?page=${page}&size=${size}&sort=createdAt,desc`);
      // Backend trả về ApiResponse<Page<ReviewDTO>>
      return response.data.data; // Trả về Page<ReviewDTO>
    } catch (error) {
      console.error(`Error fetching reviews for product ${productId}:`, error);
      throw error;
    }
  },

  // Đã sửa: Đổi tên param thành reviewContent, thêm productId vào URL
createReview: async (productId, rating, reviewContent) => {
    if (!productId || rating === undefined || rating === null) {
      throw new Error("Product ID and rating are required to create a review.");
    }

    try {
      // ✅ LẤY userId từ localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user.id) {
        throw new Error("User not logged in");
      }

      const response = await axiosInstance.post(
        `/products/${productId}/reviews`,
        {
          rating: parseInt(rating, 10),
          reviewContent, // Sửa tên field cho khớp ReviewRequest DTO
        },
        {
          headers: {
            "X-User-Id": user.id, // ✅ THÊM HEADER NÀY
          },
        }
      );
      // Backend trả về ApiResponse<Review>
      return response.data; // Trả về { data: Review, message: "..." }
    } catch (error) {
      console.error(`Error creating review for product ${productId}:`, error);
      // Ném lại lỗi để component xử lý (bao gồm cả lỗi chưa mua hàng từ BE)
      throw new Error(error.response?.data?.message || error.message || "Failed to submit review");
    }
  },


  checkUserPurchased: async (productId) => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) return false;
    
    const response = await axiosInstance.get(
      `/products/${productId}/check-purchased`,
      {
        headers: {
          "X-User-Id": user.id,
        },
      }
    );
    return response.data.data || false;
  } catch (error) {
    console.error(`Error checking purchase status for product ${productId}:`, error);
    return false;
  }
},


};

export default productService;