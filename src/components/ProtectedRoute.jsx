import { Navigate, useLocation } from "react-router-dom";
import { validateAuthState } from "../utils/authUtils";
import { showToast } from "./Toast";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { valid, reason } = validateAuthState();

  if (!valid) {
    let message = "Vui lòng đăng nhập để tiếp tục";
    
    switch(reason) {
      case "TOKEN_EXPIRED":
        message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        break;
      case "USER_INACTIVE":
        message = "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.";
        break;
      case "NO_TOKEN":
      case "NO_USER_DATA":
        message = "Vui lòng đăng nhập để tiếp tục";
        break;
    }

    // Show toast message
    showToast(message, "error");

    // Clear any existing auth data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("cart");
    window.dispatchEvent(new Event("auth-change"));

    // Redirect to login, save attempted location
    return (
      <Navigate 
        to="/login" 
        replace 
        state={{ from: location.pathname }} 
      />
    );
  }

  return children;
}