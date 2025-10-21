import axiosInstance from "./axios";

const paymentService = {
  /**
   * Tạo URL thanh toán VNPay cho đơn hàng
   * @param {number} orderId
   * @returns {Promise<{success: boolean, message: string, paymentUrl: string}>}
   */
  createPayment: async (orderId) => {
    if (orderId === undefined || orderId === null) {
      throw new Error("Order ID is required to create payment.");
    }
    try {
      const response = await axiosInstance.post(`/payment/create/${orderId}`);
      // Backend trả về { success, message, paymentUrl }
      return response.data;
    } catch (error) {
      console.error(`Error creating payment URL for order ${orderId}:`, error);
      throw error;
    }
  },

  /**
   * Lấy thông tin thanh toán của đơn hàng
   * @param {number} orderId
   * @returns {Promise<{paymentId: number, paymentMethod: string, paymentStatus: string, totalAmount: number, transactionId?: string, paymentDate?: string, createdAt: string}>}
   */
  getPaymentInfo: async (orderId) => {
     if (orderId === undefined || orderId === null) {
       throw new Error("Order ID is required to get payment info.");
     }
    try {
      const response = await axiosInstance.get(`/payment/order/${orderId}`);
      // Backend trả về Map chứa thông tin thanh toán
      return response.data;
    } catch (error) {
       // Xử lý 404 nếu chưa có thông tin thanh toán
       if (error.response && error.response.status === 404) {
          console.warn(`No payment details found for order ${orderId}`);
          return null; // Hoặc trả về một trạng thái mặc định
       }
      console.error(`Error fetching payment info for order ${orderId}:`, error);
      throw error;
    }
  },

  // handleVNPayCallback không phải là một API call trực tiếp từ FE
  // mà là xử lý redirect. Việc này thường được thực hiện trong component
  // trang callback bằng cách đọc query params từ URL.
  // Ví dụ trong component CallbackPage.jsx:
  /*
  import { useLocation, useNavigate } from 'react-router-dom';
  import { useEffect } from 'react';

  function VNPayCallbackPage() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
      const queryParams = new URLSearchParams(location.search);
      const responseCode = queryParams.get('vnp_ResponseCode');
      const orderId = queryParams.get('vnp_TxnRef')?.split('_')[0]; // Giả sử TxnRef là orderId_random

      if (responseCode === '00') {
        // Thanh toán thành công, chuyển hướng đến trang kết quả thành công
        navigate(`/payment/success?orderId=${orderId}`);
      } else {
        // Thanh toán thất bại, chuyển hướng đến trang kết quả thất bại
        const message = queryParams.get('vnp_Message') || 'Thanh toán thất bại';
        navigate(`/payment/failure?orderId=${orderId}&message=${encodeURIComponent(message)}`);
      }
    }, [location, navigate]);

    return <div>Đang xử lý thanh toán VNPay...</div>;
  }
  */


  /**
 * Parse VNPay callback params từ URL
 * @param {URLSearchParams} searchParams
 * @returns {{orderId: string, responseCode: string, transactionNo: string, success: boolean}}
 */
parseVNPayCallback: (searchParams) => {
  const vnp_TxnRef = searchParams.get("vnp_TxnRef");
  const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
  const vnp_TransactionNo = searchParams.get("vnp_TransactionNo");
  
  // Extract orderId từ TxnRef (format: orderId_random)
  const orderId = vnp_TxnRef?.split("_")[0];
  
  return {
    orderId,
    responseCode: vnp_ResponseCode,
    transactionNo: vnp_TransactionNo,
    success: vnp_ResponseCode === "00",
    message: searchParams.get("vnp_Message") || 
             (vnp_ResponseCode === "00" ? "Thanh toán thành công" : "Thanh toán thất bại"),
  };
},
};

export default paymentService;