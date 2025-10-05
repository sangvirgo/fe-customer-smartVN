import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("accessToken")
  const user = localStorage.getItem("user")

  if (!token || !user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  return children
}
