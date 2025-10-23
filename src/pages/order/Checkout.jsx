import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from 'react-hot-toast'; // Use react-hot-toast
import { CreditCard, MapPin, Package, ArrowLeft, Loader2 } from "lucide-react";
import cartService from "../../services/cartService"; // Corrected path
import userService from "../../services/userService"; // Corrected path
import orderService from "../../services/orderService"; // Corrected path
import paymentService from "../../services/paymentService"; // Corrected path


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

    // Get selected items from sessionStorage
    const selectedItemIdsStr = sessionStorage.getItem('selectedCartItemIds');
    if (!selectedItemIdsStr) {
      toast.error("No items selected. Redirecting to cart...");
      navigate("/cart");
      return;
    }
    
    const selectedItemIds = JSON.parse(selectedItemIdsStr);
    
    // Filter cart to only show selected items
    const filteredCart = {
      ...cartData,
      cartItems: cartData.cartItems.filter(item => selectedItemIds.includes(item.id))
    };
    
    // Recalculate totals for selected items
    const selectedSubtotal = filteredCart.cartItems.reduce((sum, item) => 
      sum + (item.discountedPrice || item.price) * item.quantity, 0);
    const selectedOriginalTotal = filteredCart.cartItems.reduce((sum, item) => 
      sum + item.price * item.quantity, 0);
    
    filteredCart.totalDiscountedPrice = selectedSubtotal;
    filteredCart.totalOriginalPrice = selectedOriginalTotal;
    filteredCart.discount = selectedOriginalTotal - selectedSubtotal;

    if (filteredCart.cartItems.length === 0) {
      toast.error("Selected items are no longer available. Redirecting...");
      navigate("/cart");
      return;
    }

    setCart(filteredCart);
    setAddresses(addressesData || []);
    
    if (addressesData && addressesData.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addressesData[0].id);
    }
  } catch (error) {
    toast.error(error.message || "Failed to load checkout data");
    if (error.config?.url?.includes('/cart/me')) {
      navigate("/cart");
    }
  } finally {
    setLoadingCart(false);
    setLoadingAddresses(false);
  }
};

   // Use cart data from state, avoid recalculating locally if backend provides totals
  const subtotal = cart?.totalDiscountedPrice ?? 0;
  const shipping = 0; // Replace with cart?.shippingFee if available
  const total = subtotal + shipping;

const handlePlaceOrder = async () => {
  if (!selectedAddressId) {
    toast.error("Please select a shipping address");
    return;
  }
  
  // Get selected items from sessionStorage
  const selectedItemIdsStr = sessionStorage.getItem('selectedCartItemIds');
  if (!selectedItemIdsStr) {
    toast.error("No items selected for checkout");
    navigate('/cart');
    return;
  }
  
  const selectedCartItemIds = JSON.parse(selectedItemIdsStr);
  
  if (!selectedCartItemIds || selectedCartItemIds.length === 0) {
    toast.error("Please select items to checkout");
    navigate('/cart');
    return;
  }

  setIsPlacingOrder(true);
  let createdOrder = null;

  try {
    // Use selected cart item IDs instead of all items
    const orderResponse = await orderService.createOrder(
      selectedAddressId,
      selectedCartItemIds // ✅ Chỉ gửi selected items
    );

    createdOrder = orderResponse.order;
    toast.success(orderResponse.message || "Order placed successfully!");

    // Clear selected items from sessionStorage
    sessionStorage.removeItem('selectedCartItemIds');
    
    // Clear local cart state and storage
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("cartUpdated"));
    setCart(null);


      // If VNPAY, proceed to payment creation and redirect
      if (paymentMethod === "VNPAY" && createdOrder) {
        try {
          const paymentResponse = await paymentService.createPayment(createdOrder.id);
          if (paymentResponse.success && paymentResponse.paymentUrl) {
            window.location.href = paymentResponse.paymentUrl; // Redirect to VNPay
            // Don't navigate internally here, let VNPay handle the flow
            return; // Stop execution after redirect
          } else {
             // Payment URL creation failed, show error and navigate to failure page with orderId
             toast.error(paymentResponse.message || "Failed to create VNPay payment URL");
             navigate(`/order/failure?orderId=${createdOrder.id}`);
          }
        } catch (paymentError) {
          console.error("Payment creation error:", paymentError);
          toast.error(paymentError.message || "Failed to initiate VNPay payment");
          // Navigate to failure page even if payment initiation fails
           navigate(`/order/failure?orderId=${createdOrder.id}`);
        }
      } else if (createdOrder) {
        // If COD or other non-redirect methods, navigate to success page
        navigate(`/order/success?orderId=${createdOrder.id}`);
      } else {
         // Should not happen if createOrder succeeds, but as a fallback
         toast.error("Order created but details missing.");
          navigate(`/profile?tab=orders`); // Go to order history as fallback
      }

    } catch (orderError) {
      console.error("Order placement error:", orderError);
       toast.error(orderError.message || "Failed to place order");
      // Navigate to generic failure page if order creation fails without an ID
       navigate(`/order/failure`);
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
        ) : !cart ? (
            // Added state to handle case where cart becomes null after order placement but before navigation
           <div className="text-center py-10">
               <p className="text-gray-600">Processing your order...</p>
               {/* Optional: Add a link back if stuck */}
               {/* <Link to="/" className="text-blue-600 hover:underline mt-4">Go Home</Link> */}
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
                        to="/profile?tab=addresses"
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
                   <label // Use label for better accessibility
                     htmlFor="payment-cod"
                     className={`p-4 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                       paymentMethod === "COD"
                         ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                         : "border-gray-200 hover:border-gray-300"
                     }`}
                   >
                     <span className="font-medium text-gray-800">Cash on Delivery (COD)</span>
                      <input
                        type="radio"
                        id="payment-cod"
                        name="paymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod("COD")}
                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                   </label>
                   <label // Use label
                     htmlFor="payment-vnpay"
                     className={`p-4 border rounded-lg cursor-pointer transition-all flex justify-between items-center ${
                       paymentMethod === "VNPAY"
                         ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"
                         : "border-gray-200 hover:border-gray-300"
                     }`}
                   >
                     <span className="font-medium text-gray-800">VNPay Gateway</span>
                      <input
                        type="radio"
                        id="payment-vnpay"
                        name="paymentMethod"
                        value="VNPAY"
                        checked={paymentMethod === 'VNPAY'}
                        onChange={() => setPaymentMethod("VNPAY")}
                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                       />
                   </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 self-start sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-purple-600" /> Order Summary
              </h2>
              {/* Cart Items Preview */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-4 border-b pb-4">
                {cart?.cartItems?.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-100" // Added bg color
                    />
                    <div className="flex-1 min-w-0"> {/* Added min-w-0 for truncation */}
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {item.productName}
                      </p>
                       <p className="text-xs text-gray-500">Size: {item.size}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 whitespace-nowrap"> {/* Prevent wrap */}
                      {(item.discountedPrice || item.price).toLocaleString()}đ
                    </p>
                  </div>
                ))}
              </div>

               {/* Totals Section */}
              <div className="space-y-2 mb-6">
                 {/* Original Total if discount */}
                 {cart.discount > 0 && (
                   <div className="flex justify-between text-sm">
                     <span className="text-gray-500">Original Total</span>
                     <span className="text-gray-500 line-through">{cart.totalOriginalPrice.toLocaleString()}đ</span>
                   </div>
                 )}
                  {/* Discount Amount */}
                 {cart.discount > 0 && (
                    <div className="flex justify-between text-sm">
                       <span className="text-green-600">Discount</span>
                       <span className="text-green-600 font-medium">- {cart.discount.toLocaleString()}đ</span>
                    </div>
                  )}
                 {/* Subtotal */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">
                    {subtotal.toLocaleString()}đ
                  </span>
                </div>
                 {/* Shipping */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-800">{shipping > 0 ? `${shipping.toLocaleString()}đ` : 'Free'}</span>
                </div>
                 {/* Grand Total */}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {total.toLocaleString()}đ
                  </span>
                </div>
              </div>

              {/* Place Order Button */}
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
                  `Place Order (${total.toLocaleString()}đ)` // Show total in button
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}