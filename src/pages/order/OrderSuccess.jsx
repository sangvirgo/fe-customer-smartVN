import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import orderService from '../services/orderService'; // Import orderService

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
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
      // Handle error - maybe show a generic success message if order fetch fails
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">Thank you for your purchase. Your order is being processed.</p>

        {loading ? (
           <div className="animate-pulse space-y-2">
             <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
             <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
           </div>
        ) : order ? (
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
            <p className="text-sm text-gray-800 font-medium">Order ID: <span className="font-normal text-gray-600">#{order.id}</span></p>
            <p className="text-sm text-gray-800 font-medium">Total Amount: <span className="font-normal text-gray-600">{order.totalPrice.toLocaleString()}đ</span></p>
             <p className="text-sm text-gray-800 font-medium">Payment Method: <span className="font-normal text-gray-600">{order.paymentMethod}</span></p>
             {order.shippingAddress && (
               <p className="text-sm text-gray-800 font-medium mt-1">Shipping To: <span className="font-normal text-gray-600">{order.shippingAddress.fullName}, {[order.shippingAddress.street, order.shippingAddress.ward, order.shippingAddress.province].filter(Boolean).join(", ")}</span></p>
             )}
          </div>
        ) : orderId ? (
            <p className="text-sm text-gray-500 mb-6">Order ID: #{orderId}. Details could not be loaded.</p>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/profile?tab=orders" // Link to order history
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Package className="w-5 h-5" />
            View Orders
          </Link>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}