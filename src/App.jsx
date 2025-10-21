import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header"; // Giả sử bạn có Header component
import Footer from "./components/Footer"; // Giả sử bạn có Footer component
import Home from "./pages/Home"; // Trang chủ
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Category from "./pages/Category"; // Trang danh mục/tìm kiếm
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import OrderSuccess from "./pages/OrderSuccess";
import OrderFailure from "./pages/OrderFailure";
import ProtectedRoute from "./components/ProtectedRoute"; // Component bảo vệ route
import ToastContainer from "./components/ToastContainer"; // Để hiển thị toast

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
         <ToastContainer /> {/* Add Toast Container */}
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/category" element={<Category />} /> {/* Route cho danh mục/tìm kiếm */}
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
             {/* Có thể không cần ProtectedRoute nếu muốn hiển thị lỗi cho cả khách */}
             <Route path="/order/failure" element={
               <OrderFailure />
             } />

             {/* Thêm route VNPay Callback (nếu FE cần xử lý redirect) */}
             {/* <Route path="/payment/vnpay-callback" element={<VNPayCallbackPage />} /> */}

            {/* Thêm route 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

// Basic NotFound component
const NotFound = () => (
  <div className="text-center py-20">
    <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">Go Home</Link>
  </div>
);


export default App;