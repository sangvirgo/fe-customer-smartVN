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
   * Lấy lịch sử đơn hàng của người dùng hiện tại
   * @returns {Promise<{orders: OrderDTO[], messages: string}>}
   */
  getUserOrders: async () => {
    try {
      const response = await axiosInstance.get("/orders/user");
      // Backend trả về { orders: List<OrderDTO>, messages: "..." }
      return response.data;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      throw error;
    }
  },

  /**
   * Lấy đơn hàng theo trạng thái
   * @param {string} orderStatus - 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'
   * @returns {Promise<{orders: OrderDTO[], messages: string}>}
   */
  getOrdersByStatus: async (orderStatus) => {
    if (!orderStatus) {
       throw new Error("Order status is required.");
    }
    try {
      const response = await axiosInstance.get(`/orders/status?orderStatus=${orderStatus}`);
      // Backend trả về { orders: List<OrderDTO>, messages: "..." }
       return response.data;
    } catch (error) {
      // Backend trả về 400 nếu không có đơn hàng, cần xử lý khác với lỗi 500
      if (error.response && error.response.status === 400 && error.response.data?.code === 'EMPTY_ORDER') {
         console.log(`No orders found with status: ${orderStatus}`);
         return { orders: [], messages: error.response.data.mess }; // Trả về mảng rỗng
      }
      console.error(`Error fetching orders with status ${orderStatus}:`, error);
      throw error;
    }
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