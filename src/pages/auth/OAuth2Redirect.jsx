import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { showToast } from "../../components/Toast";

export default function OAuth2Redirect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      localStorage.setItem("accessToken", token);
      
      // Fetch user info
        fetch(`${import.meta.env.VITE_API_BASE_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          localStorage.setItem("user", JSON.stringify(data.data));
          window.dispatchEvent(new Event("auth-change"));
          showToast("Login successful!", "success");
          navigate("/");
        })
        .catch(() => {
          showToast("Login failed", "error");
          navigate("/login");
        });
    } else {
      showToast("Login failed", "error");
      navigate("/login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Logging you in...</p>
      </div>
    </div>
  );
}