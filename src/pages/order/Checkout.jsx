import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CreditCard, MapPin, Package, ArrowLeft, Loader2 } from "lucide-react";
import cartService from "../services/cartService";
import userService from "../services/userService";
import orderService from "../services/orderService";
import paymentService from "../services/paymentService"; // Thêm paymentService
import { showToast } from "../components/Toast";

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD"); // Mặc định là COD

  useEffect(() => {
    fetchCartAndAddresses();
  }, []);

  const fetchCartAndAddresses = async () => {
    try {
      setLoadingCart(true);
      setLoadingAddresses(true);
      const [cartData, addressesData] = await Promise.all([
        cartService.getCart(),
        userService.getAddresses(),
      ]);
      setCart(cartData);
      setAddresses(addressesData || []); // Đảm bảo addressesData là mảng
      if (addressesData && addressesData.length > 0) {
        setSelectedAddressId(addressesData[0].id); // Chọn địa chỉ đầu tiên làm mặc định
      }
    } catch (error) {
      showToast(error.message || "Failed to load checkout data", "error");
      // Nếu không load được giỏ hàng, có thể quay về trang giỏ hàng
      if (!cart) navigate("/cart");
    } finally {
      setLoadingCart(false);
      setLoadingAddresses(false);
    }
  };

  const calculateSubtotal = () => {
    if (!cart?.cartItems) return 0;
    return cart.cartItems.reduce((total, item) => {
      const price = item.discountedPrice || item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const calculateTotal = () => {
    // Tạm thời chưa tính phí ship
    return calculateSubtotal();
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      showToast("Please select a shipping address", "error");
      return;
    }
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const cartItemIds = cart.cartItems.map((item) => item.id);
      const orderResponse = await orderService.createOrder(
        selectedAddressId,
        cartItemIds
      );

      const createdOrder = orderResponse.order; // Lấy object order từ response
      showToast(orderResponse.message || "Order placed successfully!", "success");

      // Nếu thanh toán VNPay
      if (paymentMethod === "VNPAY") {
        try {
          const paymentResponse = await paymentService.createPayment(createdOrder.id);
          if (paymentResponse.success && paymentResponse.paymentUrl) {
            // Chuyển hướng người dùng đến VNPay
            window.location.href = paymentResponse.paymentUrl;
          } else {
            showToast(paymentResponse.message || "Failed to create VNPay payment URL", "error");
            // Có thể redirect về trang lỗi hoặc order history
            navigate(`/order/failure?orderId=${createdOrder.id}`);
          }
        } catch (paymentError) {
          console.error("Payment creation error:", paymentError);
          showToast(paymentError.message || "Failed to initiate VNPay payment", "error");
          navigate(`/order/failure?orderId=${createdOrder.id}`);
        }
      } else {
        // Nếu là COD, chuyển đến trang thành công
        navigate(`/order/success?orderId=${createdOrder.id}`);
      }
       // Xóa giỏ hàng local sau khi đặt hàng thành công (nếu có)
       localStorage.removeItem("cart");
       // Dispatch event để cập nhật header
       window.dispatchEvent(new Event("cartUpdated"));

    } catch (error) {
      console.error("Order placement error:", error);
      showToast(error.message || "Failed to place order", "error");
      navigate(`/order/failure`); // Chuyển đến trang lỗi chung nếu không có orderId
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const isLoading = loadingCart || loadingAddresses;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/cart")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Shipping & Payment */}
            <div className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-blue-600" /> Shipping Address
                </h2>
                {addresses.length === 0 ? (
                  <div className="text-center py-6">
                     <p className="text-gray-600 mb-4">You have no saved addresses.</p>
                     <Link
                        to="/profile?tab=addresses" // Hoặc link đến trang thêm địa chỉ
                        className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                         Add Address in Profile
                     </Link>
                   </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => setSelectedAddressId(address.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedAddressId === address.id
                            ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <p className="font-medium text-gray-800">
                          {address.fullName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {address.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {[address.street, address.ward, address.province]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {address.note && (
                            <p className="text-xs text-gray-500 mt-1 italic">Note: {address.note}</p>
                        )}
                      </div>
                    ))}
                    <Link to="/profile?tab=addresses" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Manage Addresses</Link>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-green-600" /> Payment Method
                </h2>
                <div className="space-y-3">
                   <div
                     onClick={() => setPaymentMethod("COD")}
                     className={`p-4 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                       paymentMethod === "COD"
                         ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                         : "border-gray-200 hover:border-gray-300"
                     }`}
                   >
                     <span className="font-medium text-gray-800">Cash on Delivery (COD)</span>
                     {paymentMethod === 'COD' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                   </div>
                   <div
                     onClick={() => setPaymentMethod("VNPAY")}
                     className={`p-4 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                       paymentMethod === "VNPAY"
                         ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                         : "border-gray-200 hover:border-gray-300"
                     }`}
                   >
                     <span className="font-medium text-gray-800">VNPay Gateway</span>
                     {paymentMethod === 'VNPAY' && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                   </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 self-start sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-purple-600" /> Order Summary
              </h2>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4 border-b pb-4">
                {cart?.cartItems?.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.productName}
                      </p>
                       <p className="text-xs text-gray-500">Size: {item.size}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {(item.discountedPrice || item.price).toLocaleString()}đ
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">
                    {calculateSubtotal().toLocaleString()}đ
                  </span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-800">Free</span>
                </div> */}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {calculateTotal().toLocaleString()}đ
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder || !selectedAddressId || !cart?.cartItems?.length}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}