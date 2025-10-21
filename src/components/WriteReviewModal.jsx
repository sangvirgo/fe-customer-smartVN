"use client"

import { useState } from "react"
import { X, Star } from "lucide-react"
import axios from "../services/axios"

export default function WriteReviewModal({ isOpen, onClose, product, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    if (content.length > 500) {
      setError("Review content must be less than 500 characters")
      return
    }

    setIsLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      await axios.post(
        `/products/${product.id}/reviews`,
        { rating, content },
        {
          headers: {
            "X-User-Id": user.id,
          },
        },
      )

      // Show success toast
      const event = new CustomEvent("showToast", {
        detail: { message: "Review submitted successfully!", type: "success" },
      })
      window.dispatchEvent(event)

      onSuccess()
      onClose()
      setRating(0)
      setContent("")
    } catch (error) {
      setError(error.response?.data?.message || "Failed to submit review")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-bold text-gray-900 mb-6">Write a Review</h3>

        {/* Product Info */}
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <img
            src={product.image || "/placeholder.svg?height=80&width=80"}
            alt={product.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-semibold text-gray-900">{product.title}</h4>
            <p className="text-sm text-gray-600">{product.brand}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Content */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review (Optional)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your experience with this product..."
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">{content.length}/500 characters</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50"
          >
            {isLoading ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  )
}
