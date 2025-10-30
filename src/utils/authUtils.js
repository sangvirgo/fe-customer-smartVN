import { showToast } from '../components/Toast'; // THÊM DÒNG NÀY

/**
 * Enhanced Auth Utilities - JWT Validation & User Status Check
 */

/**
 * Decode JWT token mà không verify (chỉ để đọc payload)
 */
export const decodeToken = (token) => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Kiểm tra JWT token có hết hạn chưa
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Kiểm tra token sắp hết hạn (trong vòng 5 phút)
 */
export const isTokenExpiringSoon = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Date.now() / 1000;
  const fiveMinutes = 5 * 60;
  return decoded.exp - currentTime < fiveMinutes;
};

/**
 * Lấy thời gian còn lại của token (seconds)
 */
export const getTokenRemainingTime = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;

  const currentTime = Date.now() / 1000;
  const remaining = decoded.exp - currentTime;
  return remaining > 0 ? Math.floor(remaining) : 0;
};

/**
 * Kiểm tra user có active không (từ localStorage)
 */
export const isUserActive = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Kiểm tra nhiều trường hợp: active, isActive, status
    return user.active === true || 
           user.isActive === true || 
           user.status === 'ACTIVE' ||
           user.accountStatus === 'ACTIVE';
  } catch {
    return false;
  }
};

/**
 * Phân tích message từ backend để xác định lý do auth fail
 */
export const analyzeErrorMessage = (message) => {
  if (!message) return "UNKNOWN_ERROR";
  
  const lowerMessage = message.toLowerCase();
  
  // Token expired
  if (lowerMessage.includes("token") && 
      (lowerMessage.includes("expired") || lowerMessage.includes("hết hạn"))) {
    return "TOKEN_EXPIRED";
  }
  
  // Account locked/banned
  if (lowerMessage.includes("khóa") || 
      lowerMessage.includes("ban") || 
      lowerMessage.includes("locked") ||
      lowerMessage.includes("bị vô hiệu")) {
    return "ACCOUNT_BANNED";
  }
  
  // Account inactive
  if (lowerMessage.includes("inactive") || 
      lowerMessage.includes("không hoạt động")) {
    return "ACCOUNT_INACTIVE";
  }
  
  // Invalid token
  if (lowerMessage.includes("invalid") || 
      lowerMessage.includes("không hợp lệ")) {
    return "INVALID_TOKEN";
  }
  
  // Unauthorized
  if (lowerMessage.includes("unauthorized") || 
      lowerMessage.includes("không được phép")) {
    return "UNAUTHORIZED";
  }
  
  return "UNKNOWN_ERROR";
};

/**
 * Validate auth state - Kiểm tra token + user status
 */
export const validateAuthState = () => {
  const token = localStorage.getItem("accessToken");
  const user = localStorage.getItem("user");

  // 1. Không có token
  if (!token) {
    return { 
      valid: false, 
      reason: "NO_TOKEN",
      message: "Vui lòng đăng nhập để tiếp tục" 
    };
  }

  // 2. Token hết hạn
  if (isTokenExpired(token)) {
    return { 
      valid: false, 
      reason: "TOKEN_EXPIRED",
      message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." 
    };
  }

  // 3. Không có user data
  if (!user) {
    return { 
      valid: false, 
      reason: "NO_USER_DATA",
      message: "Vui lòng đăng nhập lại" 
    };
  }

  // 4. User không active
  if (!isUserActive()) {
    return { 
      valid: false, 
      reason: "USER_INACTIVE",
      message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ." 
    };
  }

  return { valid: true };
};

/**
 * Clear auth state và redirect về login
 */
export const forceLogout = (message = "Phiên đăng nhập đã hết hạn", redirectPath = "/login") => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  
  window.dispatchEvent(new Event("auth-change"));

  // SỬA: Gọi showToast trực tiếp
  if (typeof showToast === 'function') {
    showToast(message, "error");
  } else {
    console.error("showToast function not available");
  }

  setTimeout(() => {
    if (window.location.pathname !== redirectPath) {
      window.location.href = redirectPath;
    }
  }, 1500);
};

/**
 * Handle error từ API - Xử lý lỗi từ axios interceptor
 */
export const handleAuthError = (error) => {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message;
  
  // 401 - Unauthorized
  if (status === 401) {
    const reason = analyzeErrorMessage(message);
    
    switch (reason) {
      case "TOKEN_EXPIRED":
        forceLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        break;
        
      case "INVALID_TOKEN":
        forceLogout("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
        break;
        
      default:
        forceLogout(message || "Vui lòng đăng nhập lại");
    }
    
    return true; // Đã xử lý
  }
  
  // 403 - Forbidden (Account banned/locked)
  if (status === 403) {
    const reason = analyzeErrorMessage(message);
    
    if (reason === "ACCOUNT_BANNED" || reason === "ACCOUNT_INACTIVE") {
      forceLogout(message || "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
      return true;
    }
    
    // 403 khác (thiếu quyền truy cập resource)
    // SỬA: Gọi showToast trực tiếp
    if (typeof showToast === 'function') {
      showToast(message || "Bạn không có quyền truy cập", "error");
    }
    return true;
  }
  
  return false; // Không phải lỗi auth
};

/**
 * Auto-check auth định kỳ (dùng trong useEffect)
 */
export const setupAuthCheck = (onInvalid, intervalMs = 30000) => {
  // Check ngay lập tức
  const { valid, reason, message } = validateAuthState();
  
  if (!valid) {
    if (onInvalid) {
      onInvalid(reason, message);
    } else {
      forceLogout(message);
    }
    return () => {}; // Return empty cleanup
  }

  // Setup interval check (nếu intervalMs có giá trị)
  let intervalId = null;
  if (intervalMs) {
    intervalId = setInterval(() => {
      const { valid, reason, message } = validateAuthState();
      
      if (!valid) {
        clearInterval(intervalId);
        
        if (onInvalid) {
          onInvalid(reason, message);
        } else {
          forceLogout(message);
        }
      }
    }, intervalMs);
  }

  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

/**
 * Get user info từ token (fallback nếu localStorage không có)
 */
export const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    id: decoded.userId || decoded.sub,
    email: decoded.email,
    role: decoded.role || decoded.authorities?.[0],
  };
};