import axiosInstance from "./axios";

const orderService = {
  /**
   * Tạo đơn hàng mới từ các cart item đã chọn
   * @param {number} addressId - ID địa chỉ giao hàng
   * @param {number[]} cartItemIds - Mảng các ID của CartItem
   * @returns {Promise<{order: OrderDTO, message: string}>}
   */
  createOrder: async (addressId, cartItemIds) => {
     if (!addressId || !cartItemIds || cartItemIds.length === 0) {
       throw new Error("Address ID and at least one Cart Item ID are required.");
     }
    try {
      const response = await axiosInstance.post("/orders/create", {
        addressId,
        cartItemIds,
      });
      // Backend trả về { order: OrderDTO, message: "..." }
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  /**
   * Lấy đơn hàng của user với filters
   * @param {Object} filters - Object chứa các filter
   * @param {number} [filters.orderId] - ID đơn hàng cụ thể
   * @param {string} [filters.status] - 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
   * @param {string} [filters.startDate] - Ngày bắt đầu (format: YYYY-MM-DD)
   * @param {string} [filters.endDate] - Ngày kết thúc (format: YYYY-MM-DD)
   * @returns {Promise<{orders: OrderDTO[], message: string, total: number}>}
   */
  getUserOrders: async (filters = {}) => {
    try {
      // ✅ Build params từ filters object
      const params = {};
      
      if (filters.orderId) params.orderId = filters.orderId;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await axiosInstance.get("/orders/user", { params });
      // Backend trả về { orders: List<OrderDTO>, message: "...", total: number }
      return response.data;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  },

    // ✅ THÊM helper methods để dễ sử dụng

  /**
   * Lấy đơn hàng theo trạng thái (wrapper của getUserOrders)
   * @param {string} status - Order status
   */
  getOrdersByStatus: async (status) => {
    return orderService.getUserOrders({ status });
  },

  /**
   * Lấy đơn hàng trong khoảng thời gian
   * @param {string} startDate - Format: YYYY-MM-DD
   * @param {string} endDate - Format: YYYY-MM-DD
   */
  getOrdersByDateRange: async (startDate, endDate) => {
    return orderService.getUserOrders({ startDate, endDate });
  },

  /**
   * Tìm đơn hàng theo ID cụ thể trong lịch sử của user
   * @param {number} orderId
   */
  searchOrderById: async (orderId) => {
    return orderService.getUserOrders({ orderId });
  },

  /**
   * Lấy chi tiết đơn hàng theo ID
   * @param {number} orderId
   * @returns {Promise<OrderDTO>}
   */
  getOrderById: async (orderId) => {
     if (orderId === undefined || orderId === null) {
       throw new Error("Order ID is required.");
     }
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      // Backend trả về trực tiếp OrderDTO
      return response.data;
    } catch (error) {
      console.error(`Error fetching order with ID ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Hủy đơn hàng
   * @param {number} orderId
   * @returns {Promise<{data: OrderDTO, message: string}>}
   */
  cancelOrder: async (orderId) => {
     if (orderId === undefined || orderId === null) {
       throw new Error("Order ID is required.");
     }
    try {
      const response = await axiosInstance.put(`/orders/cancel/${orderId}`);
      // Backend trả về ApiResponse<OrderDTO>
      return response.data;
    } catch (error) {
      console.error(`Error cancelling order ${orderId}:`, error);
      throw error;
    }
  },
};

export default orderService;