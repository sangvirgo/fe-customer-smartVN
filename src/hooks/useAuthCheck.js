import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAuthState, setupAuthCheck, forceLogout } from '../utils/authUtils';
import { showToast } from '../components/Toast';

/**
 * Hook để auto-check auth trong protected components
 */
export const useAuthCheck = (options = {}) => {
  const navigate = useNavigate();
  const {
    checkOnMount = true,
    checkInterval = true,
    intervalTime = 30000,
    redirect = true,
  } = options;

  useEffect(() => {
    if (!checkOnMount && !checkInterval) return;

    const cleanup = setupAuthCheck(
      (reason, message) => {
        // Đảm bảo showToast tồn tại
        if (typeof window.showToast === 'function') {
          window.showToast(message, "error");
        } else {
          console.error("showToast function not available globally");
        }
        
        if (redirect) {
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 1500);
        }
      },
      checkInterval ? intervalTime : null
    );

    return cleanup;
  }, [checkOnMount, checkInterval, intervalTime, redirect, navigate]);
};

/**
 * Hook đơn giản - chỉ check ngay và logout
 */
export const useAuthGuard = () => {
  useEffect(() => {
    const { valid, message } = validateAuthState();
    
    if (!valid) {
      forceLogout(message);
    }
  }, []);
};

/**
 * Hook check trước khi action (ví dụ: checkout, add to cart)
 */
export const useAuthAction = () => {
  const { valid, message } = validateAuthState();
  
  return {
    isAuthenticated: valid,
    checkAuth: (actionMessage) => {
      if (!valid) {
        if (typeof window.showToast === 'function') {
          window.showToast(message || `Vui lòng đăng nhập để ${actionMessage}`, "error");
        }
        setTimeout(() => {
          // Chuyển hướng về trang login
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }, 1500);
        return false;
      }
      return true;
    }
  };
};