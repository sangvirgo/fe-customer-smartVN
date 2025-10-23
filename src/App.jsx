import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from 'react-hot-toast'; // Import Toaster
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Category from "./pages/product/Category"; // Updated path and used for /products
import ProductDetail from "./pages/product/ProductDetail"; // Updated path
import Cart from "./pages/cart/Cart"; // Updated path
import Checkout from "./pages/order/Checkout"; // Updated path
import Login from "./pages/auth/Login"; // Updated path
import Register from "./pages/auth/Register"; // Updated path
import VerifyOtp from "./pages/auth/VerifyOtp"; // Updated path
import ForgotPassword from "./pages/auth/ForgotPassword"; // Updated path
import Profile from "./pages/user/Profile"; // Updated path
import OrderSuccess from "./pages/order/OrderSuccess"; // Updated path
import OrderFailure from "./pages/order/OrderFailure"; // Updated path
import OrderDetail from "./pages/order/OrderDetail"; // Added import
import VNPayCallbackPage from "./pages/payment/VNPayCallbackPage"; // Added import
import ProtectedRoute from "./components/ProtectedRoute";
import OAuth2Redirect from "./pages/auth/OAuth2Redirect";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
         <Toaster position="top-right" reverseOrder={false} /> {/* Add Toaster component */}
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Use Category component for product listings */}
            <Route path="/products" element={<Category />} />
            <Route path="/category" element={<Category />} />
             {/* End Use Category */}
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={
               <ProtectedRoute>
                  <Cart />
               </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
             <Route path="/order/success" element={
               <ProtectedRoute>
                  <OrderSuccess />
               </ProtectedRoute>
             } />
             <Route path="/order/failure" element={
               <OrderFailure />
             } />
             <Route path="/payment/vnpay-callback" element={<VNPayCallbackPage />} />
             {/* Added OrderDetail Route */}
             <Route path="/order/:orderId" element={
               <ProtectedRoute>
                 <OrderDetail />
               </ProtectedRoute>
             } />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

// Basic NotFound component (can be moved to its own file)
const NotFound = () => (
  <div className="text-center py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go Home</Link>
  </div>
);


export default App;