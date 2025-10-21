import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingBag, Home } from 'lucide-react'; // Added Home icon

export default function OrderFailure() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  // Decode message from URL param if it exists
  const messageParam = searchParams.get('message');
  const message = messageParam ? decodeURIComponent(messageParam) : 'There was an issue processing your order.'; // Default message

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center animate-fade-in"> {/* Added animation */}
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Placement Failed</h1>
        <p className="text-gray-600 mb-6">{message}</p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
             Affected Order ID (if applicable): <span className="font-semibold text-gray-700">#{orderId}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
           <Link
             to="/cart" // Link back to cart
             className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm hover:shadow-md"
           >
             <ArrowLeft className="w-5 h-5" />
             Back to Cart
           </Link>
           <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
             <ShoppingBag className="w-5 h-5" />
             Continue Shopping
           </Link>
        </div>
         {/* Optional: Add a link to Home */}
         <div className="mt-6 text-center">
             <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1">
                 <Home className="w-4 h-4"/> Go to Homepage
             </Link>
         </div>
      </div>
       {/* Simple fade-in animation */}
       <style jsx>{`
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