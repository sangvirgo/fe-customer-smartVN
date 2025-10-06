import { Outlet } from "react-router-dom"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Outlet /> {/* Các routes con render ở đây */}
      </main>
      <Footer /> 
    </div>
  )
}