import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast'; // Use react-hot-toast
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react'; // Added Loader2
import orderService from '../../services/orderService'; // Corrected path

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
       toast.error("Order ID not found in URL.");
      setLoading(false); // No order ID, stop loading
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const fetchedOrder = await orderService.getOrderById(orderId);
      setOrder(fetchedOrder);
    } catch (error) {
      console.error("Failed to fetch order details:", error);
       toast.error(error.message || "Could not load order details.");
      // Keep showing success message even if details fail
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center animate-fade-in">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 animate-pulse-slow" /> {/* Added subtle pulse */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">Thank you for your purchase. Your order is being processed.</p>

        {/* Order Details Section */}
        {loading ? (
            <div className="my-6 flex justify-center">
               <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        ) : order ? (
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 space-y-1">
             <p className="text-sm text-gray-800">
                <span className="font-medium">Order ID:</span>
                <span className="text-gray-600 ml-2">#{order.id}</span>
             </p>
             <p className="text-sm text-gray-800">
                <span className="font-medium">Total Amount:</span>
                <span className="font-semibold text-blue-700 ml-2">{order.totalPrice.toLocaleString()}đ</span>
             </p>
             <p className="text-sm text-gray-800">
                 <span className="font-medium">Payment Method:</span>
                 <span className="text-gray-600 ml-2">{order.paymentMethod}</span>
             </p>
             {/* Add payment status if available */}
             <p className="text-sm text-gray-800">
                <span className="font-medium">Payment Status:</span>
                <span className="text-gray-600 ml-2">{order.paymentStatus || 'N/A'}</span>
             </p>
             {order.shippingAddress && (
               <p className="text-sm text-gray-800 pt-1 border-t mt-2">
                  <span className="font-medium">Shipping To:</span>
                  <span className="text-gray-600 ml-2">
                     {order.shippingAddress.fullName}, {[order.shippingAddress.street, order.shippingAddress.ward, order.shippingAddress.province].filter(Boolean).join(", ")}
                  </span>
               </p>
             )}
          </div>
        ) : orderId ? (
            // Show Order ID even if details couldn't load
            <p className="text-sm text-gray-500 mb-6">Order ID: #{orderId}. Details could not be loaded.</p>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile?tab=orders" // Link to order history
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            <Package className="w-5 h-5" />
            View My Orders
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
       {/* Simple pulse animation */}
       <style jsx>{`
          @keyframes pulse-slow {
             50% { opacity: 0.6; }
          }
         .animate-pulse-slow {
           animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
         }
         .animate-fade-in {
            animation: fadeIn 0.5s ease-out forwards;
         }
         @keyframes fadeIn {
           from { opacity: 0; transform: translateY(-10px); }
           to { opacity: 1; transform: translateY(0); }
         }
       `}</style>
    </div>
  );
}