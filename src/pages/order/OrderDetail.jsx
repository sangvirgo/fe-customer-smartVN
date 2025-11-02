import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom"; // Added Link
import toast from 'react-hot-toast'; // Use react-hot-toast
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Loader2, // Added Loader
  ArrowLeft, // Added Back Arrow
} from "lucide-react";
import orderService from "../../services/orderService"; // Use orderService
import WriteReviewModal from "../../components/WriteReviewModal"; // Corrected path

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false); // Added cancelling state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] = useState(null);

  useEffect(() => {
    if (orderId) {
       fetchOrderDetail();
    } else {
       toast.error("Order ID is missing.");
       navigate("/profile?tab=orders"); // Redirect if no ID
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    setIsLoading(true);
    try {
      const orderData = await orderService.getOrderById(orderId); // Use service
      setOrder(orderData);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast.error(error.message || "Failed to load order details");
       // Optionally navigate back if order not found (e.g., check for 404 status)
       if (error.response?.status === 404) {
           navigate("/profile?tab=orders");
       }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    // (Keep existing getStatusColor function)
     const colors = {
      PENDING: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      CONFIRMED: "bg-blue-100 text-blue-800 border border-blue-200",
      SHIPPED: "bg-purple-100 text-purple-800 border border-purple-200",
      DELIVERED: "bg-green-100 text-green-800 border border-green-200",
      CANCELLED: "bg-red-100 text-red-800 border border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };
   const getPaymentStatusColor = (status) => {
     switch (status) {
       case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
       case 'COMPLETED': return 'bg-green-100 text-green-800 border border-green-200';
       case 'FAILED': return 'bg-red-100 text-red-800 border border-red-200';
       case 'CANCELLED': return 'bg-gray-100 text-gray-800 border border-gray-200';
       case 'REFUNDED': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
       default: return 'bg-gray-100 text-gray-800 border border-gray-200';
     }
   };

  const getStatusIcon = (status) => {
    // (Keep existing getStatusIcon function)
     const icons = {
      PENDING: Clock,
      CONFIRMED: CheckCircle, // Use CheckCircle for Confirmed too
      SHIPPED: Truck,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle,
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />; // Slightly smaller icon
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) return;

    setIsCancelling(true);
    try {
      await orderService.cancelOrder(orderId); // Use service
      toast.success("Order cancelled successfully");
      fetchOrderDetail(); // Refresh order details
    } catch (error) {
       toast.error(error.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleWriteReview = (orderItem) => {
     // Pass necessary product info to the modal
     // Ensure orderItem.product contains id, title, image etc.
     if (!orderItem.product) {
        toast.error("Product details missing for review.");
        return;
     }
    setSelectedProductForReview({
       id: orderItem.productId, // Use productId from item
       title: orderItem.productTitle,
       image: orderItem.imageUrl,
       // Add other necessary fields if WriteReviewModal requires them
    });
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
     // Optionally, refresh order details to potentially update review status if backend provides it
     fetchOrderDetail();
     toast.success("Review submitted! Thank you.");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">The order details could not be loaded.</p>
          <button
            onClick={() => navigate("/profile?tab=orders")}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
             <ArrowLeft className="w-4 h-4"/> Back to Orders
          </button>
        </div>
      </div>
    );
  }

   // Status Timeline Logic (Simplified slightly)
   const statusSteps = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
   // Find index, default to -1 if status not in steps (like CANCELLED)
   const currentStepIndex = statusSteps.indexOf(order.orderStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
         {/* Back Button */}
         <button
            onClick={() => navigate("/profile?tab=orders")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-sm text-gray-500">
                  Placed on: {new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
             </p>
            </div>
             {/* Status Badge */}
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap mt-2 sm:mt-0 ${getStatusColor(order.orderStatus)}`}
            >
              {getStatusIcon(order.orderStatus)}
              {order.orderStatus}
            </span>
          </div>

          {/* Status Timeline */}
          {order.orderStatus !== "CANCELLED" && currentStepIndex >= 0 && (
            <div className="mt-6 pt-4 border-t">
               <h3 className="text-sm font-medium text-gray-500 mb-3">Order Status</h3>
              <div className="flex">
                {statusSteps.map((step, index) => (
                  <div key={step} className={`flex-1 flex items-center ${index === 0 ? 'justify-start' : index === statusSteps.length - 1 ? 'justify-end' : 'justify-center'}`}>
                    {/* Line before node (except first) */}
                    {index > 0 && (
                      <div className={`flex-1 h-0.5 ${index <= currentStepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
                    )}
                    {/* Status Node */}
                    <div className="flex flex-col items-center mx-2 flex-shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                          index <= currentStepIndex ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                         {index < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
                      </div>
                      <span className={`text-xs mt-1 text-center w-20 ${index <= currentStepIndex ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>{step}</span>
                    </div>
                     {/* Line after node (except last) */}
                     {index < statusSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 ${index < currentStepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-3">Order Items ({order.orderItems?.length || 0})</h2>
          <div className="space-y-4">
            {order.orderItems?.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 py-3 border-b last:border-b-0">
                <img
                  src={item.imageUrl || "/placeholder.svg?height=100&width=100"}
                  alt={item.productTitle}
                  className="w-full sm:w-24 h-auto sm:h-24 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 line-clamp-2">{item.productTitle}</h3>
                  {/* <p className="text-sm text-gray-500">Brand: {item.product?.brand}</p> */}
                  <p className="text-sm text-gray-500 mt-1">Size: <span className="font-medium text-gray-700">{item.size}</span></p>
                  <p className="text-sm text-gray-500">Quantity: <span className="font-medium text-gray-700">{item.quantity}</span></p>
                  {/* <p className="text-sm text-gray-600">Store: {item.store?.name}</p> */}
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                   {item.discountedPrice < item.price && (
                     <p className="text-xs text-gray-400 line-through">{item.price.toLocaleString()}đ</p>
                   )}
                  <p className="font-semibold text-gray-900">{(item.discountedPrice || item.price).toLocaleString()}đ</p>
                   <p className="text-sm text-gray-600 mt-1">x {item.quantity}</p>
                   {/* Show Write Review Button only if delivered and maybe check if already reviewed */}
                    {order.orderStatus === "DELIVERED" && (
                        <Link
                        to={`/products/${item.productId}`}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium underline disabled:text-gray-400 disabled:no-underline"
                        >
                        Write Review
                        </Link>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           {/* Shipping Address */}
           <div className="bg-white rounded-2xl shadow-lg p-6">
             <div className="flex items-center gap-2 mb-3 border-b pb-2">
               <MapPin className="w-5 h-5 text-gray-500" />
               <h2 className="text-lg font-semibold text-gray-900">Shipping Address</h2>
             </div>
             <div className="text-sm text-gray-700 space-y-1">
               <p className="font-medium">{order.shippingAddress?.fullName}</p>
               <p>{order.shippingAddress?.phoneNumber}</p>
               <p>{order.shippingAddress?.street}</p>
               <p>{order.shippingAddress?.ward}, {order.shippingAddress?.province}</p>
                {order.shippingAddress?.note && <p className="text-xs text-gray-500 italic pt-1">Note: {order.shippingAddress.note}</p>}
             </div>
           </div>

           {/* Payment Information */}
           <div className="bg-white rounded-2xl shadow-lg p-6">
             <div className="flex items-center gap-2 mb-3 border-b pb-2">
               <CreditCard className="w-5 h-5 text-gray-500" />
               <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
             </div>
             <div className="space-y-2 text-sm">
               <div className="flex justify-between">
                 <span className="text-gray-600">Method:</span>
                 <span className="font-medium text-gray-800">{order.paymentMethod}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-600">Status:</span>
                 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                   {order.paymentStatus}
                 </span>
               </div>
               {/* Transaction ID might not always be present */}
               {order.transactionId && (
                 <div className="flex justify-between">
                   <span className="text-gray-600">Transaction ID:</span>
                   <span className="font-mono text-xs text-gray-500 truncate max-w-[150px]">{order.transactionId}</span>
                 </div>
               )}
                {/* Price Breakdown within Payment Section */}
                 <div className="border-t pt-3 mt-3 space-y-1">
                     {/* Subtotal might not be directly in OrderDTO, calculate if needed or use total */}
                     {/* <div className="flex justify-between text-gray-700">
                       <span>Subtotal:</span>
                       <span>{order.subtotal?.toLocaleString() ?? '?'}đ</span>
                     </div> */}
                     {/* Shipping Fee might not be present */}
                     {/* <div className="flex justify-between text-gray-700">
                       <span>Shipping:</span>
                       <span>{order.shippingFee?.toLocaleString() ?? 0}đ</span>
                     </div> */}
                     <div className="flex justify-between text-base font-bold text-gray-900">
                       <span>Total Paid:</span>
                       <span>{order.totalPrice.toLocaleString()}đ</span>
                     </div>
                 </div>
             </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
           {/* Allow cancellation only if PENDING */}
          {order.orderStatus === "PENDING" && (
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
               {isCancelling ? <Loader2 className="w-4 h-4 animate-spin"/> : <XCircle className="w-4 h-4" />}
              Cancel Order
            </button>
          )}
          {/* Add other potential actions based on status */}
          {/* Example: Reorder button */}
          {/* {order.orderStatus === "DELIVERED" && (
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Reorder
              </button>
          )} */}

        </div>
      </div>

      {/* Write Review Modal */}
      {selectedProductForReview && (
        <WriteReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedProductForReview(null);
          }}
          product={selectedProductForReview}
          onSuccess={handleReviewSuccess} // Call success handler
        />
      )}
    </div>
  );
}