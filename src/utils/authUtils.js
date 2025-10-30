/**
 * Auth Utilities - JWT Validation & User Status Check
 */

/**
 * Decode JWT token mà không verify (chỉ để đọc payload)
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload hoặc null nếu invalid
 */
export const decodeToken = (token) => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode base64url
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
 * @param {string} token - JWT token
 * @returns {boolean} true nếu token đã hết hạn
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // exp là timestamp (seconds), Date.now() là milliseconds
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Kiểm tra token sắp hết hạn (trong vòng 5 phút)
 * @param {string} token - JWT token
 * @returns {boolean} true nếu token sắp hết hạn
 */
export const isTokenExpiringSoon = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  const currentTime = Date.now() / 1000;
  const fiveMinutes = 5 * 60; // 5 phút
  return decoded.exp - currentTime < fiveMinutes;
};

/**
 * Lấy thời gian còn lại của token (seconds)
 * @param {string} token - JWT token
 * @returns {number} Số giây còn lại, hoặc 0 nếu đã hết hạn
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
 * @returns {boolean} true nếu user active
 */
export const isUserActive = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Kiểm tra các field có thể có: active, isActive, status === 'ACTIVE'
    return user.active === true || 
           user.isActive === true || 
           user.status === 'ACTIVE' ||
           user.accountStatus === 'ACTIVE';
  } catch {
    return false;
  }
};

/**
 * Validate auth state - Kiểm tra token + user status
 * @returns {{valid: boolean, reason?: string}}
 */
export const validateAuthState = () => {
  const token = localStorage.getItem("accessToken");
  const user = localStorage.getItem("user");

  // Không có token
  if (!token) {
    return { valid: false, reason: "NO_TOKEN" };
  }

  // Token hết hạn
  if (isTokenExpired(token)) {
    return { valid: false, reason: "TOKEN_EXPIRED" };
  }

  // Không có user data
  if (!user) {
    return { valid: false, reason: "NO_USER_DATA" };
  }

  // User không active
  if (!isUserActive()) {
    return { valid: false, reason: "USER_INACTIVE" };
  }

  return { valid: true };
};

/**
 * Clear auth state và redirect về login
 * @param {string} message - Message để hiển thị
 */
export const forceLogout = (message = "Phiên đăng nhập đã hết hạn") => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("cart");
  window.dispatchEvent(new Event("auth-change"));

  if (window.showToast) {
    window.showToast(message, "error");
  }

  setTimeout(() => {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, 1500);
};

/**
 * Auto-check auth state (dùng trong useEffect)
 * @param {Function} onInvalid - Callback khi auth invalid
 */
export const setupAuthCheck = (onInvalid) => {
  // Check ngay lập tức
  const { valid, reason } = validateAuthState();
  if (!valid) {
    let message = "Vui lòng đăng nhập lại";
    
    switch(reason) {
      case "TOKEN_EXPIRED":
        message = "Phiên đăng nhập đã hết hạn";
        break;
      case "USER_INACTIVE":
        message = "Tài khoản của bạn đã bị khóa";
        break;
      case "NO_TOKEN":
      case "NO_USER_DATA":
        message = "Vui lòng đăng nhập";
        break;
    }

    if (onInvalid) {
      onInvalid(reason, message);
    } else {
      forceLogout(message);
    }
    return;
  }

  // Setup interval check mỗi 30s
  const intervalId = setInterval(() => {
    const { valid, reason } = validateAuthState();
    if (!valid) {
      clearInterval(intervalId);
      
      let message = "Vui lòng đăng nhập lại";
      if (reason === "TOKEN_EXPIRED") {
        message = "Phiên đăng nhập đã hết hạn";
      } else if (reason === "USER_INACTIVE") {
        message = "Tài khoản của bạn đã bị khóa";
      }

      if (onInvalid) {
        onInvalid(reason, message);
      } else {
        forceLogout(message);
      }
    }
  }, 30000); // Check mỗi 30s

  return () => clearInterval(intervalId);
};

/**
 * Get user info từ token (fallback nếu localStorage không có)
 * @param {string} token - JWT token
 * @returns {Object|null} User info
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