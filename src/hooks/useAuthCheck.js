import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateAuthState, forceLogout } from '../utils/authUtils';
import { showToast } from '../components/Toast';

/**
 * Hook để tự động check auth state trong protected components
 * @param {Object} options - Configuration options
 * @param {boolean} options.checkOnMount - Check ngay khi mount (default: true)
 * @param {boolean} options.checkInterval - Check định kỳ (default: true)
 * @param {number} options.intervalTime - Thời gian check (ms) (default: 30000)
 * @param {boolean} options.redirect - Tự động redirect về login (default: true)
 */
export const useAuthCheck = (options = {}) => {
  const navigate = useNavigate();
  const {
    checkOnMount = true,
    checkInterval = true,
    intervalTime = 30000, // 30s
    redirect = true,
  } = options;

  useEffect(() => {
    const handleInvalidAuth = (reason, message) => {
      showToast(message, "error");
      
      if (redirect) {
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1500);
      }
    };

    // Check ngay khi mount
    if (checkOnMount) {
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

        handleInvalidAuth(reason, message);
        return;
      }
    }

    // Setup interval check
    if (checkInterval) {
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

          handleInvalidAuth(reason, message);
        }
      }, intervalTime);

      return () => clearInterval(intervalId);
    }
  }, [checkOnMount, checkInterval, intervalTime, redirect, navigate]);
};

/**
 * Hook đơn giản hơn - chỉ check và logout
 */
export const useAuthGuard = () => {
  useEffect(() => {
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

      forceLogout(message);
    }
  }, []);
};