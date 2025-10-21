import axiosInstance from "./axios";

const cartService = {
  /**
   * Lấy giỏ hàng của người dùng hiện tại
   * @returns {Promise<CartDTO>} - Đối tượng CartDTO
   */
  getCart: async () => {
    try {
      const response = await axiosInstance.get("/cart/me");
      // Backend trả về trực tiếp CartDTO (đã enrich thông tin sản phẩm)
      return response.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Nếu lỗi 404 (Not Found) có thể là do user chưa có cart, trả về cart rỗng
      if (error.response && error.response.status === 404) {
         console.warn("Cart not found for user, returning empty cart structure.");
         return { id: null, userId: null, totalItems: 0, totalOriginalPrice: 0, totalDiscountedPrice: 0, discount: 0, cartItems: [] };
      }
      throw error;
    }
  },

  /**
   * Thêm sản phẩm vào giỏ hàng
   * @param {number} productId
   * @param {string} size
   * @param {number} quantity
   * @returns {Promise<{message: string, cart: CartItemDTO}>}
   */
  addToCart: async (productId, size, quantity) => {
    if (!productId || !size || quantity <= 0) {
      throw new Error("Product ID, size, and valid quantity are required.");
    }
    try {
      const response = await axiosInstance.post("/cart/items", {
        productId,
        size,
        quantity,
      });
      // Backend trả về { message: "...", cart: CartItemDTO }
      return response.data;
    } catch (error) {
      console.error("Error adding item to cart:", error);
      throw error;
    }
  },

  /**
   * Cập nhật số lượng item trong giỏ hàng
   * @param {number} itemId - ID của CartItem
   * @param {number} quantity - Số lượng mới (nếu là 0, item sẽ bị xóa)
   * @returns {Promise<{message: string, cart?: CartDTO}>}
   */
    updateCartItem: async (itemId, quantity, productId = null, size = null) => {
    if (itemId === undefined || itemId === null || quantity < 0) {
        throw new Error("Item ID and non-negative quantity are required.");
    }
    try {
        const payload = { quantity };
        // Nếu backend validation yêu cầu đầy đủ, thêm:
        if (productId) payload.productId = productId;
        if (size) payload.size = size;
        
        const response = await axiosInstance.put(`/cart/items/${itemId}`, payload);
        return response.data;
    } catch (error) {
        console.error(`Error updating cart item ${itemId}:`, error);
        throw error;
    }
    },

  /**
   * Xóa item khỏi giỏ hàng
   * @param {number} itemId - ID của CartItem
   * @returns {Promise<{message: string}>}
   */
  removeCartItem: async (itemId) => {
     if (itemId === undefined || itemId === null) {
        throw new Error("Item ID is required.");
     }
    try {
      const response = await axiosInstance.delete(`/cart/items/${itemId}`);
      // Backend trả về { message: "..." }
      return response.data;
    } catch (error) {
      console.error(`Error removing cart item ${itemId}:`, error);
      throw error;
    }
  },

  /**
   * Xóa toàn bộ giỏ hàng
   * @returns {Promise<{message: string}>}
   */
  clearCart: async () => {
    try {
      const response = await axiosInstance.delete("/cart/clear");
      // Backend trả về { message: "..." }
      return response.data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },
};

export default cartService;