import axiosInstance from "./axios";
import toast from 'react-hot-toast'; // Import toast for potential success messages

// Helper function to dispatch the cart update event
const dispatchCartUpdate = () => {
    window.dispatchEvent(new Event("cartUpdated"));
};

const cartService = {
  /**
   * Lấy giỏ hàng của người dùng hiện tại
   * @returns {Promise<CartDTO>} - Đối tượng CartDTO
   */
  getCart: async () => {
    try {
      const response = await axiosInstance.get("/cart/me");
      // Backend trả về trực tiếp CartDTO (đã enrich thông tin sản phẩm)
      return response.data; // Assuming data is nested under 'data' key based on other services
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Nếu lỗi 404 (Not Found) có thể là do user chưa có cart, trả về cart rỗng
      if (error.response && error.response.status === 404) {
         console.warn("Cart not found for user, returning empty cart structure.");
         // Return structure matching expected CartDTO fields
         return {
             id: null,
             userId: null, // You might get userId from localStorage if needed, but keeping it null is fine
             totalItems: 0,
             totalOriginalPrice: 0,
             totalDiscountedPrice: 0,
             discount: 0,
             cartItems: [] // Changed from 'items' to 'cartItems' to match Checkout.jsx usage
         };
      }
      // Re-throw other errors after wrapping them
       throw new Error(error.response?.data?.message || error.message || "Failed to fetch cart");
    }
  },

  /**
   * Thêm sản phẩm vào giỏ hàng
   * @param {number} productId
   * @param {string} size
   * @param {number} quantity
   * @returns {Promise<{message: string, cartItem: CartItemDTO}>} // Updated return type expectation
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
       dispatchCartUpdate(); // Dispatch update event on success
      // Backend might return { message: "...", data: CartItemDTO }
      return response.data; // Return the whole response { message, data }
    } catch (error) {
      console.error("Error adding item to cart:", error);
       throw new Error(error.response?.data?.message || error.message || "Failed to add to cart");
    }
  },

  /**
   * Cập nhật số lượng item trong giỏ hàng
   * @param {number} itemId - ID của CartItem
   * @param {number} quantity - Số lượng mới (nếu là 0, item sẽ bị xóa)
   * @param {number} [productId] - Optional productId for validation backend might need
   * @param {string} [size] - Optional size for validation backend might need
   * @returns {Promise<{message: string, cart?: CartDTO}>} // Backend might return updated cart or just message
   */
    updateCartItem: async (itemId, quantity, productId = null, size = null) => {
      if (itemId === undefined || itemId === null || quantity < 0) { // Allow quantity 0 for removal via update
          throw new Error("Item ID and non-negative quantity are required.");
      }
      try {
          const payload = { quantity };
          // Include optional fields if provided and needed by backend
          if (productId) payload.productId = productId;
          if (size) payload.size = size;

          const response = await axiosInstance.put(`/cart/items/${itemId}`, payload);
           dispatchCartUpdate(); // Dispatch update event on success
          return response.data; // Return { message, data (optional updated cart) }
      } catch (error) {
          console.error(`Error updating cart item ${itemId}:`, error);
           throw new Error(error.response?.data?.message || error.message || `Failed to update item quantity`);
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
       dispatchCartUpdate(); // Dispatch update event on success
      // Backend trả về { message: "..." }
      return response.data;
    } catch (error) {
      console.error(`Error removing cart item ${itemId}:`, error);
       throw new Error(error.response?.data?.message || error.message || "Failed to remove item");
    }
  },

  /**
   * Xóa toàn bộ giỏ hàng
   * @returns {Promise<{message: string}>}
   */
  clearCart: async () => {
    try {
      const response = await axiosInstance.delete("/cart/clear");
       dispatchCartUpdate(); // Dispatch update event on success
      // Backend trả về { message: "..." }
      return response.data;
    } catch (error) {
      console.error("Error clearing cart:", error);
       throw new Error(error.response?.data?.message || error.message || "Failed to clear cart");
    }
  },
};

export default cartService;