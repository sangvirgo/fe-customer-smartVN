import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showToast } from "../../components/Toast";
import { decodeToken, isTokenExpired, analyzeErrorMessage } from "../../utils/authUtils";

export default function OAuth2Redirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuth2Callback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");
      const errorMessage = searchParams.get("message");

      // ✅ 1. Xử lý lỗi từ backend TRƯỚC (account banned, inactive, etc.)
      if (error) {
        console.error("OAuth2 Error from backend:", error, errorMessage);
        
        const errorReason = analyzeErrorMessage(errorMessage || error);
        
        let displayMessage = "Đăng nhập thất bại";
        
        switch (errorReason) {
          case "ACCOUNT_BANNED":
          case "ACCOUNT_INACTIVE":
            displayMessage = errorMessage || "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.";
            break;
          case "TOKEN_EXPIRED":
            displayMessage = "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.";
            break;
          case "INVALID_TOKEN":
            displayMessage = "Thông tin đăng nhập không hợp lệ. Vui lòng thử lại.";
            break;
          default:
            displayMessage = errorMessage || "Đăng nhập thất bại. Vui lòng thử lại.";
        }
        
        showToast(displayMessage, "error");
        
        // Cleanup và redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("cart");
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        
        return; // ⚠️ RETURN ở đây để KHÔNG tiếp tục xử lý
      }

      // ✅ 2. Kiểm tra token có tồn tại
      if (!token) {
        showToast("Không nhận được thông tin đăng nhập. Vui lòng thử lại.", "error");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      // ✅ 3. Validate token trước khi lưu
      const decodedToken = decodeToken(token);
      
      if (!decodedToken) {
        showToast("Token không hợp lệ. Vui lòng thử lại.", "error");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      // ✅ 4. Kiểm tra token đã hết hạn chưa
      if (isTokenExpired(token)) {
        showToast("Token đã hết hạn. Vui lòng đăng nhập lại.", "error");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      // ✅ 5. Lưu token tạm thời
      localStorage.setItem("accessToken", token);

      try {
        // ✅ 6. Fetch user profile để verify account status
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1';
        const response = await fetch(`${apiBaseUrl}/users/profile`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // ✅ 7. Xử lý các status code
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.message || "Không thể lấy thông tin tài khoản";
          
          // Clear token nếu có lỗi
          localStorage.removeItem("accessToken");
          
          if (response.status === 403) {
            showToast("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.", "error");
          } else if (response.status === 401) {
            showToast("Phiên đăng nhập không hợp lệ. Vui lòng thử lại.", "error");
          } else {
            showToast(errorMsg, "error");
          }
          
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // ✅ 8. Parse user data
        const data = await response.json();
        const userData = data.data || data;

        // ✅ 9. Kiểm tra user status
        if (!userData.active && userData.active !== undefined) {
          localStorage.removeItem("accessToken");
          showToast("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.", "error");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // ✅ 10. Lưu user data
        localStorage.setItem("user", JSON.stringify(userData));
        
        // ✅ 11. Dispatch auth-change event
        window.dispatchEvent(new Event("auth-change"));
        
        // ✅ 12. Show success toast
        showToast(`Xin chào, ${userData.firstName || userData.name || 'User'}! Đăng nhập thành công.`, "success");
        
        // ✅ 13. Redirect to home
        setTimeout(() => {
          navigate("/");
        }, 1000);

      } catch (error) {
        console.error("Error fetching user profile:", error);
        
        // Clear data on error
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          showToast("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.", "error");
        } else {
          showToast("Đã có lỗi xảy ra. Vui lòng thử lại.", "error");
        }
        
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleOAuth2Callback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang xử lý đăng nhập...</h2>
        <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
        <div className="mt-6 flex justify-center gap-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}