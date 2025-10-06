import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import axios from "../../services/axios";
import WriteReviewModal from "../../components/WriteReviewModal";

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    fetchOrderDetail()
  }, [orderId])

  const fetchOrderDetail = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`/orders/${orderId}`)
      setOrder(response.data.data)
    } catch (error) {
      console.error("Failed to fetch order:", error)
      const event = new CustomEvent("showToast", {
        detail: { message: "Failed to load order details", type: "error" },
      })
      window.dispatchEvent(event)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      DELIVERED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: Clock,
      CONFIRMED: CheckCircle,
      SHIPPED: Truck,
      DELIVERED: CheckCircle,
      CANCELLED: XCircle,
    }
    const Icon = icons[status] || Clock
    return <Icon className="w-5 h-5" />
  }

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    try {
      await axios.put(`/orders/${orderId}/cancel`)
      const event = new CustomEvent("showToast", {
        detail: { message: "Order cancelled successfully", type: "success" },
      })
      window.dispatchEvent(event)
      fetchOrderDetail()
    } catch (error) {
      const event = new CustomEvent("showToast", {
        detail: { message: error.response?.data?.message || "Failed to cancel order", type: "error" },
      })
      window.dispatchEvent(event)
    }
  }

  const handleWriteReview = (product) => {
    setSelectedProduct(product)
    setShowReviewModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <button
            onClick={() => navigate("/profile?tab=orders")}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  const statusSteps = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"]
  const currentStepIndex = statusSteps.indexOf(order.orderStatus)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
              <p className="text-gray-600">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium ${getStatusColor(order.orderStatus)}`}
            >
              {getStatusIcon(order.orderStatus)}
              {order.orderStatus}
            </span>
          </div>

          {/* Status Timeline */}
          {order.orderStatus !== "CANCELLED" && (
            <div className="mt-6">
              <div className="flex justify-between items-center">
                {statusSteps.map((step, index) => (
                  <div key={step} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index <= currentStepIndex ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {index < currentStepIndex ? <CheckCircle className="w-6 h-6" /> : <span>{index + 1}</span>}
                      </div>
                      <span className="text-xs mt-2 text-gray-600">{step}</span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`flex-1 h-1 ${index < currentStepIndex ? "bg-blue-600" : "bg-gray-200"}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                <img
                  src={item.product?.image || "/placeholder.svg?height=100&width=100"}
                  alt={item.product?.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.product?.title}</h3>
                  <p className="text-sm text-gray-600">{item.product?.brand}</p>
                  <p className="text-sm text-gray-600 mt-1">Size: {item.size}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  <p className="text-sm text-gray-600">Store: {item.store?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${item.price}</p>
                  {order.orderStatus === "DELIVERED" && (
                    <button
                      onClick={() => handleWriteReview(item.product)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Write Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
          </div>
          <div className="text-gray-700">
            <p className="font-semibold">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.phoneNumber}</p>
            <p className="mt-2">{order.shippingAddress?.fullAddress}</p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Payment Information</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status:</span>
              <span
                className={`font-semibold ${order.paymentStatus === "PAID" ? "text-green-600" : "text-yellow-600"}`}
              >
                {order.paymentStatus}
              </span>
            </div>
            {order.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-mono text-sm">{order.transactionId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Price Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>${order.subtotal || order.totalPrice}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping:</span>
              <span>${order.shippingFee || 0}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total:</span>
                <span>${order.totalPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {order.orderStatus === "PENDING" && (
            <button
              onClick={handleCancelOrder}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Cancel Order
            </button>
          )}
          {order.orderStatus === "SHIPPED" && (
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium">
              Track Shipment
            </button>
          )}
          <button
            onClick={() => navigate("/profile?tab=orders")}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Orders
          </button>
        </div>
      </div>

      {/* Write Review Modal */}
      {selectedProduct && (
        <WriteReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedProduct(null)
          }}
          product={selectedProduct}
          onSuccess={fetchOrderDetail}
        />
      )}
    </div>
  )
}
