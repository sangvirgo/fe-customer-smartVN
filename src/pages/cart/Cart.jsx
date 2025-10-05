"use client";

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import axiosInstance from "../../services/axios";

export default function Cart() {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get("/api/v1/cart")
      setCartItems(response.data.data.items || [])
    } catch (err) {
      setError(err.message || "Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return

    try {
      setUpdating(true)
      await axiosInstance.put(`/api/v1/cart/items/${itemId}`, {
        quantity: newQuantity,
      })
      // Update local state
      setCartItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (err) {
      setError(err.message || "Failed to update quantity")
    } finally {
      setUpdating(false)
    }
  }

  const removeItem = async (itemId) => {
    try {
      setUpdating(true)
      await axiosInstance.delete(`/api/v1/cart/items/${itemId}`)
      setCartItems((prev) => prev.filter((item) => item.id !== itemId))
      window.dispatchEvent(new Event("cartUpdated"))
    } catch (err) {
      setError(err.message || "Failed to remove item")
    } finally {
      setUpdating(false)
    }
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.discountedPrice || item.price
      return total + price * item.quantity
    }, 0)
  }

  const calculateShipping = () => {
    // Group by store and calculate shipping per store
    const stores = [...new Set(cartItems.map((item) => item.store?.id))]
    return stores.length * 30000 // 30,000 VND per store
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping()
  }

  // Group items by store
  const groupedByStore = cartItems.reduce((acc, item) => {
    const storeId = item.store?.id || "unknown"
    if (!acc[storeId]) {
      acc[storeId] = {
        store: item.store,
        items: [],
      }
    }
    acc[storeId].items.push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="w-24 h-24 mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some products to get started!</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.values(groupedByStore).map((group) => (
              <div key={group.store?.id || "unknown"} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b">
                  {group.store?.name || "Unknown Store"}
                </h3>

                <div className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <img
                        src={item.product?.images?.[0] || "/placeholder.svg"}
                        alt={item.product?.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.product?.title}</h4>
                        <p className="text-sm text-gray-600">{item.product?.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-gray-900 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="text-gray-900 font-semibold">
                        {(item.discountedPrice || item.price) * item.quantity} VND
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900 font-semibold">{calculateSubtotal()} VND</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Shipping</span>
              <span className="text-gray-900 font-semibold">{calculateShipping()} VND</span>
            </div>
            <div className="flex justify-between mb-4">
              <span className="text-gray-900 font-semibold">Total</span>
              <span className="text-gray-900 font-semibold">{calculateTotal()} VND</span>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
