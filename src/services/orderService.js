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
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

/**
   * Lấy đơn hàng của user với filters (hỗ trợ search by orderId)
   * @param {Object} filters
   * @param {number} [filters.orderId] - Search by order ID
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.startDate] - Start date (YYYY-MM-DD)
   * @param {string} [filters.endDate] - End date (YYYY-MM-DD)
   * @param {number} [filters.page=0] - Page number
   * @param {number} [filters.size=10] - Page size
   */
  getUserOrders: async (filters = {}) => {
    try {
      const params = {};
      
      // Search by orderId
      if (filters.orderId) {
        params.orderId = filters.orderId;
        // Khi search by ID, không cần pagination
        const response = await axiosInstance.get("/orders/user", { params });
        
        const orders = Array.isArray(response.data.orders) 
          ? response.data.orders 
          : [response.data.orders].filter(Boolean);
          
        return {
          orders,
          totalPages: orders.length > 0 ? 1 : 0,
          totalElements: orders.length,
          message: response.data.message
        };
      }
      
      // Normal filtering
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.page !== undefined) params.page = filters.page;
      if (filters.size !== undefined) params.size = filters.size;

      const response = await axiosInstance.get("/orders/user", { params });
      
      return {
        orders: response.data.orders || [],
        totalPages: response.data.totalPages || 0,
        totalElements: response.data.total || 0,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error fetching user orders:", error);
      
      if (error.response?.data?.code === 'EMPTY_ORDER') {
        return {
          orders: [],
          totalPages: 0,
          totalElements: 0,
          message: error.response.data.message
        };
      }
      
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